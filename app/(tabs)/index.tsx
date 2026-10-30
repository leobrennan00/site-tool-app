import React, { useEffect, useState, useRef } from "react";
import { ScrollView, View, Text, TextInput, Button, Image, StyleSheet, Pressable, Dimensions, ActivityIndicator, Platform } from "react-native";
// react-native's own SafeAreaView is iOS-only and does nothing on Android —
// with edge-to-edge enabled in app.json the header was drawing under the
// status bar there. This one handles notch/status bar/dynamic island on both.
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import { Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import { supabase } from "../../lib/supabase";
import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
const ASSESSOR_DEFAULTS_CACHE = "assessor_defaults_v1";
import Auth from "./auth";
import { createReport, Report } from "../../lib/reports";
import { useAutoSave } from "../../hooks/useAutoSave";
import { isOnline, subscribeOnline } from "../../lib/network";
import { enqueue, subscribeQueueChanged } from "../../lib/syncQueue";
import { getUploadedPhotoUrls, getUploadedPhotoEntries, PhotoEntry } from "../../lib/offlinePhotos";
import { SyncStatusBar } from "@/components/ui/SyncStatusBar";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import {
  peFromBedrooms,
  resultBand,
  loadingRateForBand,
  polishingFilterArea,
  polishingTrenchLength,
  septicTrenchLength,
  dischargeRateM3PerHour,
} from "@/lib/designRules/dwwtsSizing";
import { DWWTS_INSTALL_OPTIONS } from "@/lib/designRules/epaCop2021";
import {
  Development, PercRange, SystemKind, deskStudyComment, visualAssessmentComment, trialHoleEvaluation as trialHoleEvaluationText,
  step4Comment, siteSpecificConditions as sscParagraph, qaInstallation, qaMaintenance as qaMaintenanceText,
  pastExperienceSuggestion, suggestExpectedRange, suggestTrenchesOrFilter, parsePE,
} from "@/lib/designRules/paragraphs";
import { useSuggestedText } from "@/hooks/useSuggestedText";
import { vulnerabilityFromGsi, vulnerabilityLabelFromGsi, deriveGwpr } from "@/lib/designRules/groundwater";
import { cacheMapsLocally, getLocalMapIndex, LocalMapIndex } from "@/lib/offlineMaps";
import { standardHole, modifiedHole, t100Hole, overallResult, pickPercolationValue, copyHoleOne, SHARED_HOLE_FIELDS } from "@/lib/percolation";
import { normalizePrefix, fullName } from "@/lib/names";
import { SoilLayer, layerErrors, layersForPayload, baseNoteForPayload } from "@/lib/trialHole";
import { startSyncEngine } from "../../lib/syncProcessor";
import { markDeskStudyPending, markDeskStudyReady, getDeskStudyStatus, DeskStudyStatus } from "../../lib/deskStudyCache";
import MapsTab from "./maps";
import PhotosTab from "./photos";
import ClientInfoTab from "./clientInfo";
import DeskStudyTab from "./deskStudy";
import VisualAssessmentTab from "./visualAssessment";
import TrialHoleTab from "./trialHole";
import SubsurfacePercTab from "./subsurfacePerc";
import SurfacePercTab from "./surfacePerc";
import ConclusionTab from "./conclusion";
import SelectedDwwtsTab from "./selectedDwwts";
import TreatmentSystemsTab from "./treatmentSystems";
import QualityAssuranceTab from "./qualityAssurance";
import SiteAssessorTab from "./siteAssessor";
import MyReportsTab from "./myReports";
import SettingsTab, { AssessorDefaults } from "./settings";
import Sidebar from "./sidebar";
import { Brand, SectionMeta } from "@/constants/theme";
import { AppHeader } from "@/components/ui/kit";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { ReportOverview, SectionId, ALL_SECTIONS } from "@/components/ui/ReportOverview";
import { DesktopShell, SectionStepper, TopBarButton } from "@/components/web/DesktopShell";
import { DesktopOverview } from "@/components/web/DesktopOverview";
import { useIsDesktop } from "@/hooks/useLayout";
import { IcoPlus, IcoDownload } from "@/components/ui/icons";
import { todayDMY } from "@/lib/dates";
import { API_BASE } from "@/lib/apiBase";
import { appendFile } from "@/lib/formFile";



const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionText}>{title}</Text>
  </View>
);


export default function Index() {
  type FlowPath = "Roots" | "Cracks" | "Wormholes" | "None";

  // Authentication state. `sessionChecked` guards the very first render: a
  // freshly-launched app has `session === null` for one tick before the
  // persisted session (now in SecureStore, see lib/supabase.ts) has been
  // read back, and without this guard that tick would flash the Auth screen
  // on every cold start — including offline ones. We only decide "truly
  // signed out" once the initial check has actually completed.
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const desktop = useIsDesktop();

  // Current report being worked on
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // Current active tab
  const [currentTab, setCurrentTab] = useState<'maps' | 'photos' | 'clientInfo' | 'deskStudy' | 'visualAssessment' | 'trialHole' | 'subsurfacePerc' | 'surfacePerc' | 'conclusion' | 'selectedDwwts' | 'treatmentSystems' | 'qualityAssurance' | 'siteAssessor' | 'myReports'>('myReports');

  // Sidebar and Settings
  const [showSidebar, setShowSidebar] = useState(false);
  const [assessorDefaults, setAssessorDefaults] = useState<AssessorDefaults | null>(null);
  const [mainView, setMainView] = useState<'currentReport' | 'myReports' | 'settings'>('myReports');

  // Report Overview navigation: null = show overview hub, otherwise show that section form
  const [currentSection, setCurrentSection] = useState<SectionId | null>(null);
  const [currentReportStatus, setCurrentReportStatus] = useState<'draft' | 'completed'>('draft');
  const [generating, setGenerating] = useState(false);

  // Ref for tab ScrollView to enable auto-scrolling
  const tabScrollViewRef = useRef<ScrollView>(null);
  const tabButtonRefs = useRef<{ [key: number]: View | null }>({});

  // Check for authentication session
  useEffect(() => {
    // Starts the background sync engine (queue processing on
    // reconnect/foreground/interval — see lib/syncProcessor.ts). Safe to
    // call once per app launch regardless of auth state; it's a no-op until
    // there's a session and something queued.
    startSyncEngine();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionChecked(true);
      if (session) {
        loadAssessorDefaults();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSessionChecked(true);
      if (session) {
        loadAssessorDefaults();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't auto-create report - user will choose from My Reports tab

  const [imgUris, setImgUris] = useState<string[]>([]);
  const [mapDescriptions, setMapDescriptions] = useState<Record<string, string>>({});
  // 'none' = never attempted · 'pending' = waiting on signal to fetch ·
  // 'ready' = desk study + maps already fetched for this report.
  const [deskStudyStatus, setDeskStudyStatus] = useState<DeskStudyStatus>('none');
  // Remote map URL → copy saved on this device, so maps show and zoom offline
  // (lib/offlineMaps.ts). Device-local only; never synced.
  const [localMapUris, setLocalMapUris] = useState<LocalMapIndex>({});
  const openReportIdRef = useRef<string | null>(null);
  useEffect(() => { openReportIdRef.current = currentReportId; }, [currentReportId]);
  // Downloads any maps for this report not yet on the device, then shows them
  // — but only if that report is still the one open when downloads finish.
  const syncLocalMaps = (reportId: string, urls: string[]) => {
    if (!urls.length || !isOnline()) return;
    cacheMapsLocally(reportId, urls)
      .then((index) => { if (openReportIdRef.current === reportId) setLocalMapUris(index); })
      .catch((err) => console.warn('Saving maps for offline use failed:', err));
  };
  // Uploaded (remote) photo URLs for the *current* report — PhotosTab now
  // owns photo capture/display itself from the local DB (see
  // app/(tabs)/photos.tsx); this state only exists so useAutoSave and the
  // report-generation payload below have the list of URLs the backend can
  // actually download. It's refreshed whenever the open report changes or
  // a photo finishes uploading in the background.
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  // The same photos with what each shows and when it was taken (lib/photoLabels.ts);
  // this is what the report generator lays out, so re-labelling a photo refreshes it.
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([]);
  useEffect(() => {
    let cancelled = false;
    const refreshPhotoUrls = () => {
      if (!currentReportId) { setPhotoUrls([]); setPhotoEntries([]); return; }
      getUploadedPhotoUrls(currentReportId).then((urls) => {
        if (!cancelled) setPhotoUrls(urls);
      });
      getUploadedPhotoEntries(currentReportId).then((entries) => {
        if (!cancelled) setPhotoEntries(entries);
      });
    };
    refreshPhotoUrls();
    const unsubscribe = subscribeQueueChanged(refreshPhotoUrls);
    return () => { cancelled = true; unsubscribe(); };
  }, [currentReportId]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [planPdfUrls, setPlanPdfUrls] = useState<string[]>([]);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  // If the desk study was left "pending" (generateMaps() was attempted
  // offline), fetch it automatically the moment we're back in signal —
  // covers the currently-open report; if the engineer has since switched to
  // a different report, its own pending desk study will fetch next time
  // it's opened online instead.
  useEffect(() => {
    return subscribeOnline((online) => {
      if (online && deskStudyStatus === 'pending' && lat && lon) {
        generateMaps();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deskStudyStatus, lat, lon]);

  // A report whose desk study is "pending" (left offline, or its Prepare for
  // site was interrupted by opening another report) fetches it when it is
  // opened while online — once per report per session, so a failing server
  // can't cause a retry loop.
  const autoDeskStudyTriedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentReportId || deskStudyStatus !== 'pending' || !lat || !lon || (loading && generatingKey === currentReportId)) return;
    if (!isOnline() || autoDeskStudyTriedRef.current.has(currentReportId)) return;
    autoDeskStudyTriedRef.current.add(currentReportId);
    generateMaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentReportId, deskStudyStatus, lat, lon]);

  const [loading, setLoading] = useState(false);
  // Which report the running "Prepare for site" belongs to ("" = unsaved new
  // report). `loading` used to be global, so opening another report while one
  // was generating showed that report as generating too.
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const generationTokenRef = useRef(0);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const [siteLocation, setSiteLocation] = useState("");
  const [clientName, setClientName] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [residents, setResidents] = useState("");
  const [waterSupply, setWaterSupply] = useState<"Mains" | "Private" | "Group" | null>(null);
  const [privateWellDetail, setPrivateWellDetail] = useState<"Existing well on-site" | "To be bored on-site" | null>(null);
  const [fileRef, setFileRef] = useState("");
  const [prefix, setPrefix] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [address, setAddress] = useState("");
  const [peComments, setPeComments] = useState("");
  // What the wastewater comes from (proposed / existing / extended house...).
  // Drives the wording of most suggested paragraphs.
  const [developmentType, setDevelopmentType] = useState<Development | null>(null);
  // Add near your other state declarations in index.tsx
  const [populationEquivalent, setPopulationEquivalent] = useState("");
  // Auto-fills P.E. from the EPA CoP 2021 bedrooms table the moment
  // bedrooms is entered, but only while P.E. is still blank — once the
  // engineer has a value there (typed or loaded from a saved report) this
  // leaves it alone, so it's always still freely editable. See
  // lib/designRules/dwwtsSizing.ts for the suggestion engine this is part
  // of (DWWTS/discharge/polishing-filter suggestions further below).
  useEffect(() => {
    const n = Number(bedrooms);
    if (!populationEquivalent.trim() && bedrooms.trim() && Number.isFinite(n) && n > 0) {
      const suggestion = peFromBedrooms(n);
      if (suggestion.value != null) setPopulationEquivalent(`P.E. = ${suggestion.value}`);   // Enda's wording
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bedrooms]);
  const [soilType, setSoilType] = useState("");
  const [subsoilType, setSubsoilType] = useState("");
  const [bedrockType, setBedrockType] = useState("");
  const [aquiferCategory, setAquiferCategory] = useState<"Regionally Important" | "Locally Important" | "Poor" | null>(null);
  const [aquiferCode, setAquiferCode] = useState<string>("");
  const [vulnerability, setVulnerability] = useState<"Extreme" | "High" | "Moderate" | "Low" | null>(null);
  // GSI label at the site point, e.g. "Extreme (X) – rock at or near surface or karst"
  const [vulnerabilityGsiLabel, setVulnerabilityGsiLabel] = useState<string>("");
  const [gwBody, setGwBody] = useState("");
  const [gwStatus, setGwStatus] = useState<"Good" | "Poor" | null>(null);
  const [nearbySupply, setNearbySupply] = useState("");  // e.g. "None" or scheme name
  const [spaZOC, setSpaZOC] = useState(false);
  const [spaSI, setSpaSI] = useState(false);
  const [spaSO, setSpaSO] = useState(false);
  const [gwProtectionResponse, setGwProtectionResponse] = useState(""); // e.g. "R1"
  // Desk-study expectation of the percolation range (assessor's call, suggested from the soil type)
  const [expectedRange, setExpectedRange] = useState<PercRange | null>(null);
  const [significantSites, setSignificantSites] = useState("");
  const [pastExperience, setPastExperience] = useState("");
  const [deskComments, setDeskComments] = useState("");
  const [landscapePosition, setLandscapePosition] = useState("");
  const [slope, setSlope] = useState<string>("");
  // 4.0 "Slope of proposed infiltration / treatment area" — typed by the
  // assessor, separate from the 3.0 site slope above (they used to share
  // one state, so 4.0 printed whatever 3.0 said).
  const [slopeProposed, setSlopeProposed] = useState<string>("");
  const [existingLandUse, setExistingLandUse] = useState("");
  const [vegIndicators, setVegIndicators] = useState("");
  const [slopeComment, setSlopeComment] = useState("");
  const [gwFlowDirection, setGwFlowDirection] = useState("");
  const [groundCondition, setGroundCondition] = useState("");
  const [siteBoundaries, setSiteBoundaries] = useState("");
  const [houses250m, setHouses250m] = useState("");
  const [roads, setRoads] = useState("");
  const [outcrops, setOutcrops] = useState("");
  const [ponding, setPonding] = useState("");
  const [lakes, setLakes] = useState("");
  const [beachesShellfish, setBeachesShellfish] = useState("");
  const [wetlands, setWetlands] = useState("");
  const [karstFeatures, setKarstFeatures] = useState("");
  const [watercourses, setWatercourses] = useState(""); // include note of water level
  const [drainageDitches, setDrainageDitches] = useState("");
  const [springs, setSprings] = useState("");
  const [wellsText, setWellsText] = useState("");   // note water level if present
  const [visualComments, setVisualComments] = useState("");
  const [thClassificationCol, setThClassificationCol] = useState("");
  const [thDilatancyCol,      setThDilatancyCol]      = useState("");
  const [thStructureCol,      setThStructureCol]      = useState("");
  const [thCompactnessCol,    setThCompactnessCol]    = useState("");
  const [thColourCol,         setThColourCol]         = useState("");
  const [thFlowpathsCol,      setThFlowpathsCol]      = useState("");


  const [likelySubsurfaceP, setLikelySubsurfaceP] = useState("");
  const [likelySurfaceP, setLikelySurfaceP] = useState("");
  const [trialDepth, setTrialDepth] = useState("");
  const [depthBedrock, setDepthBedrock] = useState("");
  const [depthWaterTable, setDepthWaterTable] = useState("");
  const [depthIngress, setDepthIngress] = useState("");
  const [rockType, setRockType] = useState("");
  const [excavDate, setExcavDate] = useState(""); // we'll swap to pickers later
  const [excavTime, setExcavTime] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");

  const handleExamDateChange = (value: string) => {
    // examDate here is the *previous* value from state
    const old = examDate;

    setExamDate(value);

    // Prefill subsurface percolation dates if they are still blank
    // or still equal to the old exam date (i.e. user hasn't customised them)
    setPercHoles((prev) =>
      prev.map((hole) => ({
        ...hole,
        preSoak1Date:
          hole.preSoak1Date === "" || hole.preSoak1Date === old
            ? value
            : hole.preSoak1Date,
        preSoak2Date:
          hole.preSoak2Date === "" || hole.preSoak2Date === old
            ? value
            : hole.preSoak2Date,
        testDate:
          hole.testDate === "" || hole.testDate === old
            ? value
            : hole.testDate,
      }))
    );

    // Same for surface percolation dates
    setSurfHoles((prev) =>
      prev.map((hole) => ({
        ...hole,
        preSoak1Date:
          hole.preSoak1Date === "" || hole.preSoak1Date === old
            ? value
            : hole.preSoak1Date,
        preSoak2Date:
          hole.preSoak2Date === "" || hole.preSoak2Date === old
            ? value
            : hole.preSoak2Date,
        testDate:
          hole.testDate === "" || hole.testDate === old
            ? value
            : hole.testDate,
      }))
    );
  };


  const [trialHoleEvaluation, setTrialHoleEvaluation] = useState("");
  const [surfStdComments, setSurfStdComments] = useState("");
  const [step4Comments, setStep4Comments] = useState(""); // <-- added state
  // Step 5 (surface) comments
  const [surfaceStep5Comments, setSurfaceStep5Comments] = useState("");

  // 4.0 Conclusion of Site Characterisation
  const [sepDistancesMet, setSepDistancesMet] = useState<boolean>(false);
  const [unsatDepth, setUnsatDepth] = useState(""); // m beneath invert (e.g. "0.90")
  const [suitableForDevelopment, setSuitableForDevelopment] = useState<boolean>(false);

  // Suitability options (check the ones that apply)
  const [optSepticTank, setOptSepticTank] = useState<boolean>(false);
  const [optSecondary, setOptSecondary] = useState<boolean>(false);
  const [optTertiary, setOptTertiary] = useState<boolean>(false);

  const [dischargeRoute, setDischargeRoute] = useState("");

  // 5.0 Selected DWWTS
  const [dwwtsInstall, setDwwtsInstall] = useState("");
  // For a secondary system: gravity percolation trenches or a pumped soil polishing filter
  const [polishingConstruction, setPolishingConstruction] = useState<"trenches" | "filter" | null>(null);
  const [treatmentUnit, setTreatmentUnit] = useState("BAF");
  const [dwwtsDischargeTo, setDwwtsDischargeTo] = useState("");
  const [invertLevel, setInvertLevel] = useState("");           // metres
  const [siteSpecificConditions, setSiteSpecificConditions] = useState("");


  // 6.0 — Septic Tank Systems (Chapter 7)
  const [septTankCapacity, setSeptTankCapacity] = useState(""); // m³

const TANK_TYPES = [
  "Eurotank BAF2",
  "Eurotank BAF2 + TER3",
  "Chieftain SBR",
  "Oxtec",
  "Premier Tech ASP",
  "TER 3",
];


  // Percolation Area
  const [septPercNoTrenches, setSeptPercNoTrenches] = useState("");
  const [septPercLenTrenches, setSeptPercLenTrenches] = useState(""); // m
  const [septPercInvertLevel, setSeptPercInvertLevel] = useState(""); // m

  // Mounded Percolation Area
  const [septMoundNoTrenches, setSeptMoundNoTrenches] = useState("");
  const [septMoundLenTrenches, setSeptMoundLenTrenches] = useState(""); // m
  const [septMoundInvertLevel, setSeptMoundInvertLevel] = useState(""); // m

  // 6.0 — Secondary Treatment + Polishing Filter

  // Left column: systems receiving septic tank effluent (Chapter 8)
  // Four media rows: Sand/Soil, Soil, Constructed Wetland, Other
  type MediaRow = { area: string; depth: string; invert: string };
  const [secSandSoil, setSecSandSoil] = useState<MediaRow>({ area: "", depth: "", invert: "" });
  const [secSoil, setSecSoil]       = useState<MediaRow>({ area: "", depth: "", invert: "" });
  const [secWetland, setSecWetland] = useState<MediaRow>({ area: "", depth: "", invert: "" });
  const [secOther, setSecOther]     = useState<MediaRow>({ area: "", depth: "", invert: "" });

  // Right column: packaged secondary (Chapter 9)
  const [packagedType, setPackagedType] = useState("");
  const [packagedPE, setPackagedPE]     = useState("");
  const [primaryCompartment, setPrimaryCompartment] = useState("0"); // m³
  const [tankModalVisible, setTankModalVisible] = useState(false);

  // Polishing filter (Section 10.1)
  const [pfSurfaceArea, setPfSurfaceArea] = useState(""); // m²
  // Options beneath (direct discharge vs pumped etc.)
  const [optDirectArea, setOptDirectArea] = useState(""); // Option 1
  const [optPumpedArea, setOptPumpedArea] = useState(""); // Option 2 default as per sample

  // Gravity / low pressure / drip dispersal lengths/areas (right side of PF options)
  const [optGravityLength, setOptGravityLength] = useState(""); // Option 3 trench length (m)
  const [optLowPressureLength, setOptLowPressureLength] = useState(""); // Option 4 trench length (m)
  const [optDripArea, setOptDripArea] = useState(""); // Option 5 surface area (m²)

  // 6.0 — Tertiary Treatment System (Section 10.2)
  const [tertiaryPurpose, setTertiaryPurpose] = useState("");
  const [tertiaryPerformance, setTertiaryPerformance] = useState("");
  const [tertiaryDesign, setTertiaryDesign] = useState("");

  // Discharge Route
  const [dischargeChoice, setDischargeChoice] = useState<"groundwater"|"surface">("groundwater");
  const [hydraulicLoadingRate, setHydraulicLoadingRate] = useState(""); // l/m².d
  const [surfaceAreaM2, setSurfaceAreaM2] = useState("");              // m²
  const [dischargeRateM3hr, setDischargeRateM3hr] = useState("");      // m³/hr (ALWAYS editable)

  // Filled with the standard wording for the chosen system (see useSuggestedText below)
  const [qaInstall, setQaInstall] = useState("");
  const [qaMaintenance, setQaMaintenance] = useState("");

  // 7.0 — SITE ASSESSOR DETAILS
  const [assCompany, setAssCompany] = useState("");
  const [assPrefix, setAssPrefix] = useState("");
  const [assFirst, setAssFirst] = useState("");
  const [assSurname, setAssSurname] = useState("");
  const [assAddress, setAssAddress] = useState("");
  const [assQuals, setAssQuals] = useState("");
  const [assDateOfReport, setAssDateOfReport] = useState(""); // DD/MM/YYYY
  useEffect(() => {
    // Autofill on first load only (won’t override if user already typed something)
    setAssDateOfReport((prev) => prev?.trim() ? prev : todayDMY());
  }, []);
  const [assPhone, setAssPhone] = useState("");
  const [assEmail, setAssEmail] = useState("");
  const [assIndemnity, setAssIndemnity] = useState("");


  const [healthStatus, setHealthStatus] = useState<string>("unknown");

  async function testBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const json = await res.json();
    setHealthStatus(json?.status ?? "no status");
    Alert.alert("Backend Health", JSON.stringify(json, null, 2));
  } catch (err: any) {
    setHealthStatus("error");
    Alert.alert("Backend Health", String(err?.message || err));
  }
}

  async function sendEchoTest() {
    try {
      const res = await fetch(`${API_BASE}/echo_test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hello: "world" }), // minimal payload for now
      });
      const json = await res.json();
      Alert.alert("Echo response", JSON.stringify(json, null, 2));
    } catch (err: any) {
      Alert.alert("Echo error", String(err?.message || err));
    }
  }


  async function getCurrentLocation() {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Update lat/lon state
      setLat(location.coords.latitude.toString());
      setLon(location.coords.longitude.toString());

      Alert.alert('Success', 'Location updated to your current position!');
    } catch (error: any) {
      Alert.alert('Error', `Failed to get location: ${error.message}`);
    }
  }

  async function prefillFromLayerSummaries(currentLat: string, currentLon: string, alreadyFetched?: any) {
    try {
      // /generate_maps already returns the same summaries; only fetch them
      // separately if we weren't given any (one less request to fail).
      let summaries: any = alreadyFetched && Object.keys(alreadyFetched).length ? alreadyFetched : null;
      if (!summaries) {
        const url = `${API_BASE}/layer_summaries?lat=${encodeURIComponent(
          currentLat
        )}&lon=${encodeURIComponent(currentLon)}`;

        const res = await fetch(url);
        if (!res.ok) {
          console.warn("layer_summaries failed with status", res.status);
          return;
        }

        const json = await res.json();
        summaries = (json && (json as any).summaries) || {};
      }

      // --- Soils ---
      const soils = summaries.soils;
      if (soils && typeof soils.description === "string" && !soilType) {
        setSoilType(soils.description);
      }

      // --- Subsoils ---
      const sub = summaries.subsoils;
      if (sub && typeof sub.description === "string" && !subsoilType) {
        setSubsoilType(sub.description);
      }

      // --- Bedrock ---
      const bed = summaries.bedrock;
      if (bed && typeof bed.description === "string" && !bedrockType) {
        setBedrockType(bed.description);
      }

      // --- Aquifer Category (map description -> enum) + code ---
      const aq = summaries.aquifer;
      if (aq && typeof aq.description === "string") {
        const desc = String(aq.description);
        const lower = desc.toLowerCase();

        let cat: "Regionally Important" | "Locally Important" | "Poor" | null = null;
        if (lower.includes("regionally")) {
          cat = "Regionally Important";
        } else if (lower.includes("locally")) {
          cat = "Locally Important";
        } else if (lower.includes("poor")) {
          cat = "Poor";
        }

        if (cat && !aquiferCategory) {
          setAquiferCategory(cat as any);
        }

        if (aq.code && !aquiferCode) {
          // Map every GSI AQUIFERCAT code to the matching radio button option.
          // Order matters — longer/more specific codes must come before shorter prefixes.
          const codeMap: Record<string, string> = {
            "Rkc":   "Rk",      // Karstified conduit
            "Rkd":   "Rk",      // Karstified diffuse
            "Rf/Rk": "Rf/Rk",   // Mixed fissured/karstified
            "Rk":    "Rk",
            "Rf":    "Rf",
            "Rg":    "Rg",
            "Lk":    "Lk",      // Locally Important Karstified
            "Ll":    "Ll",
            "Lm":    "Lm",
            "Pl":    "Pl",
            "Pu":    "Pu",
          };
          const raw = String(aq.code).trim();
          const matched = codeMap[raw];
          if (matched) setAquiferCode(matched);
        }
      }

      // --- Vulnerability ---
      const vulCat = vulnerabilityFromGsi(summaries.vulnerability);
      if (vulCat && !vulnerability) {
        setVulnerability(vulCat);
      }
      setVulnerabilityGsiLabel(vulnerabilityLabelFromGsi(summaries.vulnerability) ?? "");

      // --- Groundwater Body ---
      const gwb = summaries.groundwater_body;
      if (gwb && !gwBody) {
        // One line, as on the EPA form: "Tulla-Newmarket on Fergus IE_SH_G_229"
        // (the description is the map caption, with a "Status:" line).
        const oneLine = [gwb.name, gwb.code].filter(Boolean).join(" ").trim();
        if (oneLine) setGwBody(oneLine);
        else if (typeof gwb.description === "string") setGwBody(gwb.description.split("\n")[0].replace(/^Groundwater Body:\s*/i, ""));
      }

      // --- Groundwater Body Status ---
      if (gwb && typeof gwb.status === "string" && !gwStatus) {
        const status = String(gwb.status);
        const lower = status.toLowerCase();

        if (lower.includes("good")) {
          setGwStatus("Good");
        } else if (lower.includes("poor")) {
          setGwStatus("Poor");
        }
      }

      // Groundwater Protection Response isn't set here any more (it used to be
      // derived once, from this raw response, and silently skipped whenever
      // vulnerability didn't parse). It's now derived reactively from the
      // form's aquifer + vulnerability + SPA values — see the GWPR effect.

      // --- Groundwater Flow Direction ---
      const flow = summaries.groundwater_flow;
      if (flow && typeof flow.direction_text === "string" && !gwFlowDirection) {
        setGwFlowDirection(flow.direction_text);
      }

      // --- Source Protection Areas ---
      const spa = summaries.source_protection;
      if (spa) {
        if (spa.ZOC) setSpaZOC(true);
        if (spa.SI)  setSpaSI(true);
        if (spa.SO)  setSpaSO(true);
      }
    } catch (err) {
      console.warn("Failed to prefill from layer_summaries", err);
    }
  }


  async function generateReportMinimal() {
    try {
      const res = await fetch(`${API_BASE}/generate_report_from_app`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // super-minimal payload — backend is tolerant of missing fields
          fileRef: "TEST-0001",
          prefix: "Mr",
          firstName: "Testy",
          surname: "McTestface",
          reportDate: todayDMY(),
        }),
      });

      const json = await res.json();
      // success shape should be: { status: "ok", url: "/static/reports/....pdf", filled: {...} }
      if (json?.status === "ok") {
        Alert.alert("Report created", `URL: ${API_BASE}${json.url}`);
      } else {
        Alert.alert("Report error", JSON.stringify(json, null, 2));
      }
    } catch (err: any) {
      Alert.alert("Network error", String(err?.message || err));
    }
  }








  // --- derived percolation values (choose Step 4 vs Step 5) ---
  // T100 ≤ 210 → standard method, 210–300 → modified, > 300 → unsuitable
  // (lib/percolation.ts). Subsurface now follows the same rule; it used to
  // just take whichever method had a result. Until a T100 is entered it still
  // falls back to whichever method has one.
  const pickSurfacePV = () => pickPercolationValue(surfAvgT100, surfStdResult, surfModResult);
  const pickSubsurfacePV = () => {
    const avgT100 = overallResult(percHoles.map(h => t100Hole(h.fillTime, h.waterLevelTime))).value;
    return pickPercolationValue(avgT100, stdResult, modResult, true);
  };

  // --- 4.0 state you already had ---
  /* keep your existing:
    sepDistancesMet, unsatDepth, suitableForDevelopment,
    optSepticTank, optSecondary, optTertiary, dischargeRoute
    (4.0 slope is `slopeProposed`, not the 3.0 `slope`)
  */

  // --- auto-fill control (dirty flags = user has edited) ---
  const [cDirty, setCDirty] = useState({
    unsatDepth: false,
    sepDistancesMet: false,
    suitable: false,
    discharge: false,
  });

  



  type SurfModBand = {
    start: string;   // HH:mm
    finish: string;  // HH:mm
    tn?: number;     // minutes (computed)
    kt?: number;     // tn / Tf  (computed)
    tVal?: number;   // 4.45 / kt (computed)
  };

  type SurfModHole = {
    id: string;                                    // "1" | "2" | "3"
    bands: [SurfModBand, SurfModBand, SurfModBand, SurfModBand];
    holeT?: number;                                 // average T-value across 4 bands
    comments?: string;
  };

  const SURF_TF_FACTORS = [8.1, 9.7, 11.9, 14.1] as const; // 300→250, 250→200, 200→150, 150→100

  const mkSurfModHole = (id: string): SurfModHole => ({
    id,
    bands: [{ start: "", finish: "" }, { start: "", finish: "" }, { start: "", finish: "" }, { start: "", finish: "" }],
  });

  const [surfModHoles, setSurfModHoles] = useState<SurfModHole[]>([
    mkSurfModHole("1"),
    mkSurfModHole("2"),
    mkSurfModHole("3"),
  ]);

  const [surfModResult, setSurfModResult] = useState<number | null>(null); // overall Surface Percolation Value


  type SurfStdFill = { start: string; finish: string; deltaMin?: number };
  type SurfStdHole = {
    id: string;  // "1" | "2" | "3"
    fills: [SurfStdFill, SurfStdFill, SurfStdFill];
    avgDelta?: number;
    ts?: number; // Average Δt / 4
  };

  const mkSurfStdHole = (id: string): SurfStdHole => ({
    id,
    fills: [{ start: "", finish: "" }, { start: "", finish: "" }, { start: "", finish: "" }],
  });

  const [surfStdHoles, setSurfStdHoles] = useState<SurfStdHole[]>([
    mkSurfStdHole("1"),
    mkSurfStdHole("2"),
    mkSurfStdHole("3"),
  ]);

  const [surfStdResult, setSurfStdResult] = useState<number | null>(null); // Surface Percolation Value



  type SurfHole = {
    id: string;                 // "1" | "2" | "3"
    // Step 1 – prep
    topDepth: string;
    baseDepth: string;
    holeDepth: string;          // can be typed or auto-filled
    dimensions: string;         // e.g. "300 x 300"

    // Step 2 – pre-soak
    preSoak1Date: string;
    preSoak1Time: string;
    preSoak2Date: string;
    preSoak2Time: string;

    // Step 3 – T100
    testDate: string;
    fillTime: string;           // time filled to 400 mm
    waterLevelTime: string;     // time at 300 mm
    t100?: number;              // computed minutes
  };

  const mkSurfHole = (id: string): SurfHole => ({
    id,
    topDepth: "", baseDepth: "", holeDepth: "", dimensions: "",
    preSoak1Date: "", preSoak1Time: "", preSoak2Date: "", preSoak2Time: "",
    testDate: "", fillTime: "", waterLevelTime: "", t100: undefined,
  });

  const [surfHoles, setSurfHoles] = useState<SurfHole[]>([
    mkSurfHole("1"), mkSurfHole("2"), mkSurfHole("3")
  ]);

    // --- Hole 1 pre-fills holes 2 and 3 (size, pre-soak, test date, 400 mm fill time) ---

  type HoleSharedField = (typeof SHARED_HOLE_FIELDS)[number];

  const updatePercHoleField = (index: number, field: HoleSharedField, value: string) => {
    setPercHoles((prev) => {
      const next = prev.map((h, i) => (i === index ? { ...h, [field]: value } : h));
      return index === 0 ? copyHoleOne(prev, next) : next;
    });
  };


  const [surfAvgT100, setSurfAvgT100] = useState<number | null>(null);



  type ModifiedBand = {
    start: string;      // "HH:mm"
    finish: string;     // "HH:mm"
    tn?: number;        // minutes (computed)
    kt?: number;        // tn / Tf     (computed)
    tVal?: number;      // 4.45 / kt   (computed)
  };

  type ModifiedHole = {
    id: string;                 // "1" | "2" | "3"
    bands: [ModifiedBand, ModifiedBand, ModifiedBand, ModifiedBand];
    holeT?: number;             // average T-Value across bands
    comments?: string;
  };

  const TF_FACTORS = [8.1, 9.7, 11.9, 14.1] as const; // 300→250, 250→200, 200→150, 150→100

  const mkModHole = (id: string): ModifiedHole => ({
    id,
    bands: [{ start: "", finish: "" }, { start: "", finish: "" }, { start: "", finish: "" }, { start: "", finish: "" }],
  });

  const [modHoles, setModHoles] = useState<ModifiedHole[]>([
    mkModHole("1"),
    mkModHole("2"),
    mkModHole("3"),
  ]);

  const [modResult, setModResult] = useState<number | null>(null);  // overall subsurface value


  type PercTestHole = {
    id: string;
    topDepth: string;
    baseDepth: string;
    holeDepth: string;
    dimensions: string;

    preSoak1Date: string;
    preSoak1Time: string;
    preSoak2Date: string;
    preSoak2Time: string;

    testDate: string;
    fillTime: string;
    waterLevelTime: string;
    t100: string;
  };

  const [percHoles, setPercHoles] = useState<PercTestHole[]>([
    { id: "1", topDepth: "", baseDepth: "", holeDepth: "", dimensions: "",
      preSoak1Date: "", preSoak1Time: "", preSoak2Date: "", preSoak2Time: "",
      testDate: "", fillTime: "", waterLevelTime: "", t100: "" },
    { id: "2", topDepth: "", baseDepth: "", holeDepth: "", dimensions: "",
      preSoak1Date: "", preSoak1Time: "", preSoak2Date: "", preSoak2Time: "",
      testDate: "", fillTime: "", waterLevelTime: "", t100: "" },
    { id: "3", topDepth: "", baseDepth: "", holeDepth: "", dimensions: "",
      preSoak1Date: "", preSoak1Time: "", preSoak2Date: "", preSoak2Time: "",
      testDate: "", fillTime: "", waterLevelTime: "", t100: "" },
  ]);



  type StandardFill = { start: string; finish: string; deltaMin?: number };
  type StandardHole = {
    id: string;                // "1" | "2" | "3"
    fills: [StandardFill, StandardFill, StandardFill];
    avgDelta?: number;
    ts?: number;               // Average Δt / 4
  };

  const newStandardHole = (id: string): StandardHole => ({
    id,
    fills: [{ start: "", finish: "" }, { start: "", finish: "" }, { start: "", finish: "" }],
  });

  const [stdHoles, setStdHoles] = useState<StandardHole[]>([
    newStandardHole("1"),
    newStandardHole("2"),
    newStandardHole("3"),
  ]);

  const [stdResult, setStdResult] = useState<number | null>(null); // overall subsurface value



  // 3.2 soil layers (from/to + the six log columns). Drawn on the PDF at
  // their true depths by the backend (pdf_fill.stamp_trial_hole_log).
  const [soilLayers, setSoilLayers] = useState<SoilLayer[]>([]);

    // Percolation arithmetic lives in lib/percolation.ts (shared with the
    // tests and mirrored by the backend). These helpers only copy its
    // results onto the hole objects the screens and payload already use.
    // A hole with some but not all readings gets no value and is excluded
    // from the overall result; the screens show which hole and why.
    const applyStandard = <F extends { start: string; finish: string; deltaMin?: number },
                           H extends { fills: F[]; avgDelta?: number; ts?: number }>(holes: H[]) => {
      const updated = holes.map(h => {
        const r = standardHole(h.fills);
        const fills = h.fills.map((f, i) => ({ ...f, deltaMin: r.deltas[i] ?? undefined }));
        return { ...h, fills, avgDelta: r.avgDelta ?? undefined, ts: r.value ?? undefined } as H;
      });
      return { updated, overall: overallResult(updated.map(h => standardHole(h.fills))).value };
    };

    // K = T_f / T_m and T = 4.45 / K per band. This used to be computed as
    // K = T_m / T_f, which inverted every modified-method T-value.
    const applyModified = <B extends { start: string; finish: string; tn?: number; kt?: number; tVal?: number },
                           H extends { bands: B[]; holeT?: number }>(holes: H[]) => {
      const updated = holes.map(h => {
        const r = modifiedHole(h.bands);
        const bands = h.bands.map((b, i) => ({
          ...b,
          tn: r.bands[i].tm ?? undefined,
          kt: r.bands[i].k ?? undefined,
          tVal: r.bands[i].t ?? undefined,
        }));
        return { ...h, bands, holeT: r.value ?? undefined } as H;
      });
      return { updated, overall: overallResult(updated.map(h => modifiedHole(h.bands))).value };
    };

    const recomputeStandard = (holes: StandardHole[]) => {
      const { updated, overall } = applyStandard(holes);
      setStdHoles(updated);
      setStdResult(overall);
    };

        // Update a single field and recompute (subsurface standard method)
    // Update a single field and recompute (subsurface standard method)
    const setStdField = (
      holeIdx: number,
      fillIdx: number,
      key: "start" | "finish",
      val: string
    ) => {
      const prev = stdHoles;
      const copy = structuredClone
        ? structuredClone(prev)
        : (JSON.parse(JSON.stringify(prev)) as typeof stdHoles);

      const hole = copy[holeIdx];
      if (!hole) {
        return;
      }

      // Update the field on this fill
      (hole.fills[fillIdx] as any)[key] = val;

      // If user edits FINISH, auto-fill NEXT START in same hole
      // but ONLY while that start value is still blank or still equal
      // to the previous finish value (i.e. user hasn't customised it).
      if (key === "finish") {
        const nextIdx = fillIdx + 1;
        if (nextIdx < hole.fills.length) {
          const prevHole = prev[holeIdx];
          if (prevHole) {
            const prevFinish =
              ((prevHole.fills[fillIdx] as any).finish as string) || "";
            const prevNextStart =
              ((prevHole.fills[nextIdx] as any).start as string) || "";

            if (prevNextStart === "" || prevNextStart === prevFinish) {
              (hole.fills[nextIdx] as any).start = val;
            }
          }
        }
      }

      recomputeStandard(copy);
    };



    const recomputeModified = (holes: ModifiedHole[]) => {
      const { updated, overall } = applyModified(holes);
      setModHoles(updated);
      setModResult(overall);
    };

    const setModField = (holeIdx: number, bandIdx: number, key: "start" | "finish", val: string) => {
      const copy = JSON.parse(JSON.stringify(modHoles)) as ModifiedHole[];
      (copy[holeIdx].bands[bandIdx] as any)[key] = val;
      recomputeModified(copy);
    };

    const recomputeSurfaceT100 = (holes: SurfHole[]) => {
      const results = holes.map(h => t100Hole(h.fillTime, h.waterLevelTime));
      setSurfHoles(holes.map((h, i) => ({ ...h, t100: results[i].value ?? undefined })));
      setSurfAvgT100(overallResult(results).value);
    };

    // convenience setter
    const setSurfField = (hi: number, key: keyof SurfHole, val: string) => {
      let copy = JSON.parse(JSON.stringify(surfHoles)) as SurfHole[];
      (copy[hi] as any)[key] = val;
      // auto-calc hole depth if both top/base present
      if ((key === "topDepth" || key === "baseDepth")) {
        const top = parseFloat(copy[hi].topDepth);
        const base = parseFloat(copy[hi].baseDepth);
        if (!Number.isNaN(top) && !Number.isNaN(base) && base >= top) {
          copy[hi].holeDepth = (base - top).toString();
        }
      }
      // hole 1 pre-fills the shared fields of holes 2 and 3
      if (hi === 0) copy = copyHoleOne(surfHoles, copy);
      // recompute T100 after time edits
      if (key === "fillTime" || key === "waterLevelTime") {
        recomputeSurfaceT100(copy);
      } else {
        setSurfHoles(copy);
      }
    };


    const recomputeSurfStandard = (holes: SurfStdHole[]) => {
      const { updated, overall } = applyStandard(holes);
      setSurfStdHoles(updated);
      setSurfStdResult(overall);
    };


    // Update a single field and recompute (surface standard method)
    const setSurfStdField = (
      holeIdx: number,
      fillIdx: number,
      key: "start" | "finish",
      val: string
    ) => {
      const prev = surfStdHoles;
      const copy = JSON.parse(JSON.stringify(prev)) as SurfStdHole[];

      const hole = copy[holeIdx];
      if (!hole) {
        return;
      }

      (hole.fills[fillIdx] as any)[key] = val;

      if (key === "finish") {
        const nextIdx = fillIdx + 1;
        if (nextIdx < hole.fills.length) {
          const prevHole = prev[holeIdx];
          if (prevHole) {
            const prevFinish =
              ((prevHole.fills[fillIdx] as any).finish as string) || "";
            const prevNextStart =
              ((prevHole.fills[nextIdx] as any).start as string) || "";

            if (prevNextStart === "" || prevNextStart === prevFinish) {
              (hole.fills[nextIdx] as any).start = val;
            }
          }
        }
      }

      recomputeSurfStandard(copy);
    };



    const recomputeSurfModified = (holes: SurfModHole[]) => {
    const { updated, overall } = applyModified(holes);
    setSurfModHoles(updated);
    setSurfModResult(overall);
  };

  const setSurfModField = (holeIdx: number, bandIdx: number, key: "start" | "finish", val: string) => {
    const copy = JSON.parse(JSON.stringify(surfModHoles)) as SurfModHole[];
    (copy[holeIdx].bands[bandIdx] as any)[key] = val;
    recomputeSurfModified(copy);
  };


  // Decide which result to use based on T100 thresholds (matches the form logic)
  const surfacePV = (() => {
    // you already computed: surfAvgT100, surfStdResult, surfModResult
    if (surfAvgT100 === null) return null;
    if (surfAvgT100 > 300) return 91; // any value >90 means unsuitable; we'll just show 91
    if (surfAvgT100 <= 210) return surfStdResult ?? null;
    return surfModResult ?? null;
  })();

  const subSurfacePV = (() => {
    // you already computed: stdResult, modResult and have T100 (avg across perc holes) from your subsurface Step 3
    // If you saved it as e.g. percAvgT100, use that. If not, default to standard when you fill Step 4; else modified.
    // Replace 'percAvgT100' with your actual subsurface average T100 variable name (if you made one).
    // If you didn't, this fallback prefers whichever result exists.
    // ---- start fallback:
    if (stdResult !== null) return stdResult;
    if (modResult !== null) return modResult;
    return null;
    // ---- if you *do* have 'percAvgT100', use:
    // if (percAvgT100 === null) return null;
    // if (percAvgT100 <= 210) return stdResult ?? null;
    // return modResult ?? null;
  })();

  useEffect(() => {
    // 2.1 Percolation values pushed into the read-only fields
    const sPV = pickSurfacePV();
    const ssPV = pickSubsurfacePV();
    // You’ll display these directly in read-only TextInputs in the UI (no state needed)

    // 2.2 Separation distances: default to true if you’ve got no red flags (you can refine later)
    if (!cDirty.sepDistancesMet) {
      setSepDistancesMet(true);
    }

    // 2.3 Unsaturated depth is a site measurement — left for the assessor to
    // enter (it used to be pre-filled with 0.90, which then printed on
    // reports where nobody had measured it).

    // 2.4 Suitable for development: simple rule of thumb
    if (!cDirty.suitable) {
      const okSurface = sPV != null && sPV <= 90;
      const okSub = ssPV != null && ssPV <= 90;
      // Blank = not entered yet: don't let a missing measurement flip the
      // suggestion (behaves as the old 0.90 default did).
      const okUnsat = !unsatDepth.trim() || parseFloat(unsatDepth) >= 0.9;
      const okSep = sepDistancesMet;
      setSuitableForDevelopment(Boolean(okSurface && okSub && okUnsat && okSep));
    }

    // 2.5 Discharge route default
    if (!cDirty.discharge && !dischargeRoute) {
      setDischargeRoute("Via subsoil to groundwater");
    }
  }, [
    // deps that may change upstream
    surfAvgT100, surfStdResult, surfModResult,
    stdResult, modResult, percHoles,
    unsatDepth, sepDistancesMet, dischargeRoute,
    cDirty,
  ]);

  const sPV = pickSurfacePV();
  const ssPV = pickSubsurfacePV();

  // ---- DWWTS sizing suggestions (EPA CoP 2021) ----
  // Pure, offline, derived from P.E. + the subsurface percolation result +
  // slope + the chosen system — see lib/designRules/dwwtsSizing.ts. Each
  // effect below only fills its field while that field is still empty
  // (same "suggest, never overwrite" convention as the Conclusion
  // auto-fills above), and the *Reason values are passed down to the
  // screens to show under each suggested field.
  const peValue = parsePE(populationEquivalent);
  // Enda sizes on the slower (higher) of the subsurface and surface results
  // (e.g. report 26003: 37.3 / 41.7 -> band 41-50).
  const designPV = ssPV != null && sPV != null && sPV <= 90 ? Math.max(ssPV, sPV) : ssPV;

  const bandSuggestion = designPV != null
    ? resultBand(designPV)
    : { value: null as string | null, reason: "Complete the subsurface percolation test (Step 4/5) first." };

  const loadingRateSuggestion = bandSuggestion.value
    ? loadingRateForBand(bandSuggestion.value)
    : { value: null as number | null, reason: bandSuggestion.reason };

  const filterAreaSuggestion = (peValue && designPV != null)
    ? polishingFilterArea(peValue, designPV)
    : { value: null as number | null, reason: "Enter P.E. and complete the percolation test first." };

  const polishTrenchSuggestion = (peValue && designPV != null)
    ? polishingTrenchLength(peValue, designPV)
    : { value: null as { totalM: number; trenchCount: number; lengthEach: number } | null, reason: "Enter P.E. and complete the percolation test first." };

  const septicTrenchSuggestion = (peValue && designPV != null)
    ? septicTrenchLength(peValue, designPV)
    : { value: null as { totalM: number; trenchCount: number } | null, reason: "Enter P.E. and complete the percolation test first." };

  // ---- Suggested paragraphs in Enda Colleran's standard wording ----
  // lib/designRules/paragraphs.ts builds each one from this report's data;
  // useSuggestedText fills a box only while it is empty or still holds the
  // last suggestion, so anything the assessor writes is kept.
  const constructionSuggestion = suggestTrenchesOrFilter({
    gwpr: gwProtectionResponse, bedrock: depthBedrock, waterTable: depthWaterTable, development: developmentType,
  });
  const systemKind: SystemKind | null =
    dwwtsInstall === DWWTS_INSTALL_OPTIONS.septicTank ? "septic"
    : dwwtsInstall === DWWTS_INSTALL_OPTIONS.tertiary ? "tertiary"
    : dwwtsInstall === DWWTS_INSTALL_OPTIONS.secondaryAndPolishingFilter
      ? (polishingConstruction ?? constructionSuggestion?.value ?? null)
      : null;
  const suggestedParagraph = sscParagraph({
    system: systemKind,
    pe: peValue,
    band: bandSuggestion.value,
    filterArea: Number(pfSurfaceArea) || filterAreaSuggestion.value,
    trenches: systemKind === "septic" && septicTrenchSuggestion.value
      ? { count: septicTrenchSuggestion.value.trenchCount, lengthEach: septicTrenchSuggestion.value.totalM / septicTrenchSuggestion.value.trenchCount, total: septicTrenchSuggestion.value.totalM }
      : systemKind === "trenches" && polishTrenchSuggestion.value
        ? { count: polishTrenchSuggestion.value.trenchCount, lengthEach: polishTrenchSuggestion.value.lengthEach, total: polishTrenchSuggestion.value.totalM }
        : null,
    gwpr: gwProtectionResponse, bedrock: depthBedrock, waterTable: depthWaterTable,
    unitName: treatmentUnit, development: developmentType,
  });
  const paragraphReason = suggestedParagraph
    ? undefined
    : !dwwtsInstall ? "Choose a system above to get the standard wording."
    : !peValue ? "Enter the P.E. (Client & Site Info) to get the standard wording."
    : "Complete the percolation tests to get the standard wording.";

  const suggestedDeskComment = deskStudyComment({
    soilType, expectedRange: expectedRange ?? suggestExpectedRange(soilType), vulnerability,
    aquiferCategory, gwpr: gwProtectionResponse, development: developmentType,
  });
  const suggestedVisualComment = visualAssessmentComment({
    landscape: landscapePosition, groundCondition, vegIndicators, drainageDitches, watercourses, lakes,
    waterSupply, privateWell: privateWellDetail, development: developmentType,
  });
  const suggestedTrialEval = trialHoleEvaluationText({
    layers: layersForPayload(soilLayers), depth: trialDepth, bedrock: depthBedrock, waterTable: depthWaterTable,
    ingress: depthIngress, likelyPV: likelySubsurfaceP, development: developmentType,
  });
  const suggestedStep4Sub = step4Comment({ kind: "subsurface", likelyPV: likelySubsurfaceP, actualPV: ssPV, development: developmentType });
  const suggestedStep4Surf = step4Comment({ kind: "surface", likelyPV: likelySurfaceP || likelySubsurfaceP, actualPV: sPV, development: developmentType });
  const suggestedQaInstall = qaInstallation(systemKind);
  const suggestedQaMaintenance = qaMaintenanceText(systemKind);
  const suggestedPastExperience = pastExperienceSuggestion(developmentType);
  // Boilerplate earlier builds pre-filled; treated as "not written by the assessor"
  const LEGACY_QA = [
    "I have read the relevant sections of the EPA CoP and the specification is in accordance with the manual.",
    "I have read the relevant sections of the EPA CoP and maintenance requirements have been set out in accordance with the manual.",
    "The wastewater treatment system must be installed in accordance with the manufacturer's instructions. The soil polishing filter must be installed in accordance with the plans attached below.",
    "The homeowner must enter into a maintenance contract with the system manufacturer. The system must be inspected and maintained on an annual basis.",
  ];
  // earlier builds pre-filled "[PLACEHOLDER — … wording TBD]" here
  useSuggestedText(siteSpecificConditions, setSiteSpecificConditions, suggestedParagraph, currentReportId, [/^\[PLACEHOLDER/]);
  useSuggestedText(deskComments, setDeskComments, suggestedDeskComment, currentReportId);
  useSuggestedText(visualComments, setVisualComments, suggestedVisualComment, currentReportId);
  useSuggestedText(trialHoleEvaluation, setTrialHoleEvaluation, suggestedTrialEval, currentReportId);
  useSuggestedText(step4Comments, setStep4Comments, suggestedStep4Sub, currentReportId);
  useSuggestedText(surfStdComments, setSurfStdComments, suggestedStep4Surf, currentReportId);
  useSuggestedText(qaInstall, setQaInstall, suggestedQaInstall, currentReportId, LEGACY_QA);
  useSuggestedText(qaMaintenance, setQaMaintenance, suggestedQaMaintenance, currentReportId, LEGACY_QA);
  useSuggestedText(pastExperience, setPastExperience, suggestedPastExperience, currentReportId);

  // Soil polishing filter area: pfSurfaceArea (Chapter 8) and surfaceAreaM2
  // (Discharge Route) map to the *same* PDF field on the backend, so they
  // must always agree — the second effect below keeps surfaceAreaM2
  // mirrored to pfSurfaceArea any time it changes, suggested or hand-edited.
  useEffect(() => {
    if (filterAreaSuggestion.value != null && !pfSurfaceArea) {
      setPfSurfaceArea(String(filterAreaSuggestion.value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAreaSuggestion.value]);

  useEffect(() => {
    if (pfSurfaceArea && pfSurfaceArea !== surfaceAreaM2) {
      setSurfaceAreaM2(pfSurfaceArea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pfSurfaceArea]);

  // Like Enda: a gravity polishing filter gets the Option 3 trench length,
  // a pumped one the Option 2 surface area — never both.
  useEffect(() => {
    if (systemKind === "trenches" && polishTrenchSuggestion.value != null && !optGravityLength) {
      setOptGravityLength(String(polishTrenchSuggestion.value.totalM));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polishTrenchSuggestion.value?.totalM, systemKind]);

  useEffect(() => {
    if (systemKind === "filter" && pfSurfaceArea && !optPumpedArea) setOptPumpedArea(pfSurfaceArea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pfSurfaceArea, systemKind]);

  useEffect(() => {
    if (peValue && !dischargeRateM3hr) setDischargeRateM3hr(String(dischargeRateM3PerHour(peValue)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peValue]);

  useEffect(() => {
    if (septicTrenchSuggestion.value != null) {
      if (!septPercLenTrenches) setSeptPercLenTrenches(String(septicTrenchSuggestion.value.totalM));
      if (!septPercNoTrenches) setSeptPercNoTrenches(String(septicTrenchSuggestion.value.trenchCount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [septicTrenchSuggestion.value?.totalM, septicTrenchSuggestion.value?.trenchCount]);

  useEffect(() => {
    if (loadingRateSuggestion.value != null && !hydraulicLoadingRate) {
      setHydraulicLoadingRate(String(loadingRateSuggestion.value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingRateSuggestion.value]);


  // ---- Groundwater Protection Response (EPA CoP Table 2) ----
  // Derived from the form's aquifer + vulnerability (+ SPA), so it follows
  // manual corrections too — not just the one-off desk-study lookup. It
  // re-suggests only while the field is empty or still holds the value the
  // app last suggested; once the assessor picks a different GWPR it's theirs.
  const gwprSuggestion = deriveGwpr({
    aquiferCode, aquiferCategory, vulnerability, spaSI, spaSO,
  });
  const gwprAutoRef = useRef<string | null>(null);
  // A different report's saved GWPR belongs to that report's assessor, not
  // to the app — forget the last auto value whenever the open report changes.
  // (Declared before the effect below so it runs first in the same commit.)
  useEffect(() => { gwprAutoRef.current = null; }, [currentReportId]);
  useEffect(() => {
    const untouched = !gwProtectionResponse || gwProtectionResponse === gwprAutoRef.current;
    if (!untouched) return;
    const next = gwprSuggestion.value ?? "";
    if (next !== gwProtectionResponse) setGwProtectionResponse(next);
    gwprAutoRef.current = gwprSuggestion.value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gwprSuggestion.value]);

  // Discharge route: a single house is never permitted to discharge to
  // surface water, so default to groundwater and let the screens grey out
  // the surface-water option rather than leaving it a live choice.
  useEffect(() => {
    if (!dwwtsDischargeTo) setDwwtsDischargeTo("Ground Water");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);










  async function pickAndUploadSitePhotos() {
  try {
    // Ask permission first
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "We need access to your photos to attach site photos to the report."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    if (!("assets" in result) || !Array.isArray(result.assets) || result.assets.length === 0) {
      Alert.alert("No photos selected", "Please choose at least one photo.");
      return;
    }

    const newUrls: string[] = [];

    for (const asset of result.assets) {
      if (!asset.uri) continue;

      // Derive a filename if we don't have one
      const fileName =
        (asset as any).fileName ||
        `site_photo_${Date.now()}_${Math.floor(Math.random() * 100000)}.jpg`;

      const formData = new FormData();
      await appendFile(formData, "file", asset.uri, fileName, "image/jpeg");

      const res = await fetch(`${API_BASE}/upload_photo`, {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type manually; React Native will set correct multipart boundary
      });

      if (!res.ok) {
        const txt = await res.text();
        console.warn("Upload failed:", txt);
        continue;
      }

      const json = await res.json();
      // Expecting backend to return something like { status: "ok", url: "/static/photos/xxx.jpg" }
      if (json?.url) {
        newUrls.push(String(json.url));
      }
    }

    if (newUrls.length === 0) {
      Alert.alert("Upload", "No photos were uploaded successfully.");
      return;
    }

    setPhotoUrls((prev) => [...prev, ...newUrls]);

    Alert.alert(
      "Upload complete",
      `Added ${newUrls.length} site photo${newUrls.length === 1 ? "" : "s"} to the report.`
    );
  } catch (err: any) {
    console.error("pickAndUploadSitePhotos error", err);
    Alert.alert("Photo upload error", String(err?.message || err));
  }
}

  async function generateSignature() {
    const name = `${assFirst} ${assSurname}`.trim();
    if (!name) {
      Alert.alert("Name required", "Enter your first and last name before generating a signature.");
      return;
    }
    if (!isOnline()) {
      Alert.alert(
        "Signature needs signal",
        "Everything else on this form saves offline, but generating the signature image needs a connection — add it once you're back in signal, or just tap Generate Report and it'll queue until then."
      );
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/generate_signature?name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        const txt = await res.text();
        console.warn("Signature generation failed:", txt);
        Alert.alert("Error", "Could not generate signature.");
        return;
      }
      const json = await res.json();
      if (json?.url) {
        setSignatureUrl(String(json.url));
        Alert.alert("Signature generated", "Auto-generated e-signature added to the report.");
      }
    } catch (err: any) {
      Alert.alert("Error", String(err?.message || err));
    }
  }

  async function pickAndUploadSignature() {
    if (!isOnline()) {
      Alert.alert(
        "Signature needs signal",
        "Everything else on this form saves offline, but uploading a signature image needs a connection — add it once you're back in signal, or just tap Generate Report and it'll queue until then."
      );
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "We need access to your photos to attach your signature to the report."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert("No image selected", "Please choose a signature image.");
        return;
      }

      const fileName =
        (asset as any).fileName ||
        `signature_${Date.now()}_${Math.floor(Math.random() * 100000)}.png`;

      const formData = new FormData();
      await appendFile(formData, "file", asset.uri, fileName, "image/png");

      const res = await fetch(`${API_BASE}/upload_signature`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.warn("Signature upload failed:", txt);
        Alert.alert("Upload failed", "Could not upload signature.");
        return;
      }

      const json = await res.json();
      if (json?.url) {
        setSignatureUrl(String(json.url));
        Alert.alert("Signature added", "Your e-signature will be added to the report.");
      }
    } catch (err: any) {
      console.warn("pickAndUploadSignature error", err);
      Alert.alert("Error", String(err?.message || err));
    }
  }

  async function pickAndUploadPlans() {
    try {
      // Let user pick one or more PDFs
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const assets = result.assets || [];
      if (!assets.length) {
        Alert.alert("No file selected", "Please choose at least one PDF plan.");
        return;
      }

      const newUrls: string[] = [];

      for (const asset of assets) {
        if (!asset.uri) continue;

        const fileName =
          asset.name ||
          `site_plan_${Date.now()}_${Math.floor(Math.random() * 100000)}.pdf`;

        const formData = new FormData();
        await appendFile(formData, "file", asset.uri, fileName, "application/pdf");

        const res = await fetch(`${API_BASE}/upload_plan_pdf`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const txt = await res.text();
          console.warn("Plan upload failed:", txt);
          continue;
        }

        const json = await res.json();
        if (json?.url) {
          newUrls.push(String(json.url));
        }
      }

      if (!newUrls.length) {
        Alert.alert("Upload", "No plan PDFs were uploaded successfully.");
        return;
      }

      setPlanPdfUrls((prev) => [...prev, ...newUrls]);

      Alert.alert(
        "Plans added",
        `Attached ${newUrls.length} plan PDF${newUrls.length === 1 ? "" : "s"} to this report.`
      );
    } catch (err: any) {
      console.error("pickAndUploadPlans error", err);
      Alert.alert("Plan upload error", String(err?.message || err));
    }
  }

  async function onDrivePlanPicked(fileId: string, fileName: string, accessToken: string) {
    try {
      const safeFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

      // Download to local cache via expo-file-system/legacy so we get a proper file URI
      const LegacyFS = await import("expo-file-system/legacy");
      const localUri = `${LegacyFS.cacheDirectory}drive_${Date.now()}_${safeFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      const dl = await LegacyFS.downloadAsync(driveUrl, localUri, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (dl.status !== 200) {
        Alert.alert("Download error", "Could not download the file from Google Drive.");
        return;
      }

      // Upload using the same { uri, name, type } format as device uploads — works reliably in RN
      const formData = new FormData();
      await appendFile(formData, "file", dl.uri, safeFileName, "application/pdf");

      const res = await fetch(`${API_BASE}/upload_plan_pdf`, { method: "POST", body: formData });
      if (!res.ok) {
        const txt = await res.text();
        console.warn("Drive plan upload failed:", txt);
        Alert.alert("Upload error", "Could not upload the plan PDF.");
        return;
      }
      const json = await res.json();
      if (json?.url) {
        setPlanPdfUrls((prev) => [...prev, String(json.url)]);
        Alert.alert("Plan added", `"${safeFileName}" attached to this report.`);
      }
    } catch (err: any) {
      console.error("onDrivePlanPicked error", err);
      Alert.alert("Error", String(err?.message || err));
    }
  }

  async function generateReport() {
    try {
      // minimal guardrails
      if (!fileRef?.trim()) {
        Alert.alert("Missing File Ref", "Please enter a File Ref first.");
        return;
      }

      // Percolation results that only cover some holes are still generated,
      // but only after the assessor has seen which holes are missing.
      const percChecks: [string, string[]][] = [
        ["Subsurface T₁₀₀", overallResult(percHoles.map(h => t100Hole(h.fillTime, h.waterLevelTime))).warnings],
        ["Subsurface standard method", overallResult(stdHoles.map(h => standardHole(h.fills))).warnings],
        ["Subsurface modified method", overallResult(modHoles.map(h => modifiedHole(h.bands))).warnings],
        ["Surface T₁₀₀", overallResult(surfHoles.map(h => t100Hole(h.fillTime, h.waterLevelTime))).warnings],
        ["Surface standard method", overallResult(surfStdHoles.map(h => standardHole(h.fills))).warnings],
        ["Surface modified method", overallResult(surfModHoles.map(h => modifiedHole(h.bands))).warnings],
      ];
      const thErrors = layerErrors(soilLayers, trialDepth);
      if (thErrors.length) percChecks.push(["Trial hole soil layers", thErrors]);
      const percWarnings = percChecks.filter(([, w]) => w.length);
      if (percWarnings.length) {
        const proceed = await new Promise<boolean>((resolve) =>
          Alert.alert(
            "Check before generating",
            percWarnings.map(([name, w]) => `${name}:\n${w.join("\n")}`).join("\n\n") +
              "\n\nPercolation averages only cover complete holes; the trial hole log is drawn as entered.",
            [
              { text: "Go back", style: "cancel", onPress: () => resolve(false) },
              { text: "Generate anyway", onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) },
          ),
        );
        if (!proceed) return;
      }

      // Force-save whatever's still sitting in the autosave debounce window
      // (up to 600ms of typing) before building the payload below, so the
      // very last edit before tapping this button is never missed — both in
      // the generated report and in what's saved/synced for this report.
      await flushAutoSave();

      const reportPayload = {
          // PAGE 1
          lat: Number((lat || "").toString().trim()),
          lon: Number((lon || "").toString().trim()),
          fileRef: (fileRef || "").trim(),
          prefix: normalizePrefix(prefix),   // a title or nothing, never a name typed into the box
          firstName: (firstName || "").trim(),
          surname: (surname || "").trim(),
          address: (address || "").trim(),
          siteLocation: (siteLocation || "").trim(),
          populationEquivalent: (populationEquivalent || "").trim(),
          bedrooms: (bedrooms ?? "").toString().trim(),
          residents: (residents ?? "").toString().trim(),
          waterSupply: (waterSupply || "").toLowerCase().trim(), // "mains" | "private" | "group"
          privateWellDetail: privateWellDetail || "",
          reportDate: todayDMY(),

          soilType: (soilType || "").trim(),
          subsoilType: (subsoilType || "").trim(),
          bedrockType: (bedrockType || "").trim(),
          aquiferCategory: (aquiferCategory || "").trim(),
          aquiferCode: aquiferCode || "",
          vulnerability: (vulnerability || "").trim(),

          groundwaterBody: (gwBody || "").trim(),
          groundwaterStatus: (gwStatus as string || "").trim(),       // "Good" | "Poor"
          publicScheme1km: (nearbySupply || "").trim(),               // e.g., "None"
          

          spaZOC: !!spaZOC,
          spaSI:  !!spaSI,
          spaSO:  !!spaSO,

          gwProtectionResponse: (gwProtectionResponse || "").trim(),  // e.g., "R1"
          significantSites: (significantSites || "").trim(),
          pastExperience: (pastExperience || "").trim(),
          deskComments: (deskComments || "").trim(),


            //  Visual Assessment (3.1) ---
          landscapePosition: (landscapePosition || "").trim(),
          slope: (slope as string || "").trim(),
          slopeComment: (slopeComment || "").trim(),

          va_houses: (houses250m || "").trim(),
          va_landUse: (existingLandUse || "").trim(),
          va_vegetation: (vegIndicators || "").trim(),
          va_gwFlowDirection: (gwFlowDirection || "").trim(),
          va_groundCondition: (groundCondition || "").trim(),
          va_siteBoundaries: (siteBoundaries || "").trim(),
          va_roads: (roads || "").trim(),
          va_outcrops: (outcrops || "").trim(),
          va_ponding: (ponding || "").trim(),
          va_lakes: (lakes || "").trim(),
          va_beaches: (beachesShellfish || "").trim(),
          va_wetlands: (wetlands || "").trim(),
          va_karst: (karstFeatures || "").trim(),
          va_streams: (watercourses || "").trim(),
          va_ditches: (drainageDitches || "").trim(),
          va_springs: (springs || "").trim(),
          va_wells: (wellsText || "").trim(),
          va_comments: (visualComments || "").trim(),

            // --- 3.2 TRIAL HOLE — Basics (uses your exact state names)
          th_depthTrialHole: (trialDepth || "").trim(),
          th_depthToBedrock: (depthBedrock || "").trim(),
          th_depthToWaterTable: (depthWaterTable || "").trim(),
          th_waterIngress: (depthIngress || "").trim(),
          th_rockType: (rockType || "").trim(),
          th_excavationDate: (excavDate || "").trim(),     // "DD/MM/YYYY"
          th_excavationTime: (excavTime || "").trim(),     // "HH:mm"
          th_examinationDate: (examDate || "").trim(),     // "DD/MM/YYYY"
          th_examinationTime: (examTime || "").trim(),     // "HH:mm"
          // --- 3.2 Trial Hole — Soil Columns (manual full-column text) ---
          th_classificationColumn: (thClassificationCol || "").trim(),
          th_dilatancyColumn:      (thDilatancyCol || "").trim(),
          th_structureColumn:      (thStructureCol || "").trim(),
          th_compactnessColumn:    (thCompactnessCol || "").trim(),
          th_colourColumn:         (thColourCol || "").trim(),
          th_flowpathsColumn:      (thFlowpathsCol || "").trim(),


          // --- 3.2 Soil layers, drawn at true depth on the log ---
          soil_layers: layersForPayload(soilLayers),
          th_baseNote: baseNoteForPayload(soilLayers, trialDepth),

          // (optional but on this page) Likely percolation values
          likelySubsurfacePV: likelySubsurfaceP,
          likelySurfacePV:   likelySurfaceP,

          // --- 3.2 Evaluation big text box (page 7 target) ---
          th_evaluation: trialHoleEvaluation,

          subsurfacePrep: {
            holes: (percHoles || []).slice(0, 3).map(h => {
              // parse "300x300", "300 x 300", etc.
              const nums = (h.dimensions || "").match(/\d+(\.\d+)?/g) || [];
              const L = nums[0] ? Math.round(parseFloat(nums[0])) : undefined;
              const W = nums[1] ? Math.round(parseFloat(nums[1])) : undefined;

              const toMM = (s: string) => {
                const n = parseFloat((s || "").replace(/,/g, ""));
                return Number.isFinite(n) ? Math.round(n) : undefined;
              };
              const top  = toMM(h.topDepth);
              const base = toMM(h.baseDepth);
              const depth = toMM(h.holeDepth) ?? (
                top != null && base != null ? (base - top) : undefined
              );

              return {
                top_mm: top,
                base_mm: base,
                depth_mm: depth,
                length_mm: L,
                breadth_mm: W, // (PDF field is "Breath?", backend handles the misspelling)
              };
            }),
          },

          subsurfacePreSoak: {
            holes: (percHoles || []).slice(0, 3).map(h => ({
              first:  { date: (h.preSoak1Date || "").trim(), time: (h.preSoak1Time || "").trim() },
              second: { date: (h.preSoak2Date || "").trim(), time: (h.preSoak2Time || "").trim() },
            })),
          },

          // Small “Measuring T100” rows (date/time400/time300)
          subsurfaceMeasure: {
            holes: (percHoles || []).slice(0, 3).map(h => ({
              date: (h.testDate || "").trim(),
              time_400: (h.fillTime || "").trim(),
              time_300: (h.waterLevelTime || "").trim(),
            })),
          },

            // T100 minutes table (duplicate a single minutes value into three fills per hole)
            // T100 minutes table (duplicate a single minutes value into three fills per hole)
          // --- Step 4: Standard method (SUBSURFACE) — fill Start/End/Δt + Average ---
          subsurfaceT100: {
            holes: (stdHoles || []).slice(0, 3).map(h => ({
              fills: (h.fills || []).slice(0, 3).map(f => ({
                start: (f.start || "").trim(),          // maps to Start{n} / 2Start{n} / 3Start{n}
                end:   (f.finish || "").trim(),         // maps to End{n}   / 2End{n}   / 3End{n}
                minutes: typeof f.deltaMin === "number"
                  ? f.deltaMin.toFixed(2)               // maps to Minutes{n} / 2Minutes{n} / 3Minutes{n} with 2 decimals
                  : "",                                 // backend will compute if blank
              })),
            })),
          },


          // --- Add Step 4 comments so backend maps to Comment1 ---
          step4_comments: (step4Comments || "").trim(),

          // --- Step 5: Modified Method (SUBSURFACE) — backend expects surfaceT100 with runs A–D ---
          surfaceT100: {
            holes: (modHoles || []).slice(0, 3).map(hole => ({
              runs: (hole.bands || []).slice(0, 4).map((band, i) => ({
                label: ["A", "B", "C", "D"][i],
                start: (band.start  || "").trim(),
                end:   (band.finish || "").trim(),
              })),
            })),
          },


          // Right-hand comments box on the Step 5 grid
          step5_comments: (modHoles?.map(h => (h as any).comments).filter(Boolean).join("\n\n") || "").trim(),

          // --- PAGE 9: 3.3(b) SURFACE — Step 3 (Measuring T100) ---
          
          // --- PAGE 9: 3.3(b) SURFACE — Steps 1–4 ---
          surface33b: {
            // Step 1 — prep
            prep: {
              holes: (surfHoles || []).slice(0, 3).map(h => {
                const nums = (h.dimensions || "").match(/\d+(\.\d+)?/g) || [];
                const L = nums[0] ? Math.round(parseFloat(nums[0])) : undefined;
                const W = nums[1] ? Math.round(parseFloat(nums[1])) : undefined;
                const toMM = (s: string) => {
                  const n = parseFloat(String(s || "").replace(/,/g, ""));
                  return Number.isFinite(n) ? Math.round(n) : undefined;
                };
                const top  = toMM(h.topDepth);
                const base = toMM(h.baseDepth);
                const depth = toMM(h.holeDepth) ?? (top != null && base != null ? base - top : undefined);
                return { top_mm: top, base_mm: base, depth_mm: depth, length_mm: L, breadth_mm: W };
              }),
            },

            // Step 2 — pre-soak
            presoak: {
              holes: (surfHoles || []).slice(0, 3).map(h => ({
                date1: (h.preSoak1Date || "").trim(),
                time1: (h.preSoak1Time || "").trim(),
                date2: (h.preSoak2Date || "").trim(),
                time2: (h.preSoak2Time || "").trim(),
              })),
            },

            // Step 3 — Measuring T100 (bottom mini-rows)
            measure: {
              holes: (surfHoles || []).slice(0, 3).map(h => ({
                date:     (h.testDate || "").trim(),
                time_400: (h.fillTime || "").trim(),
                time_300: (h.waterLevelTime || "").trim(),
              })),
            },

            // Step 4 — Standard Method (maps to 10*, 10_2*, 10_3*)
            t100: {
              // Hole 1 -> 10Start*/End*/Minutes*, Average10
              run1: {
                "1": { start: (surfStdHoles[0]?.fills[0]?.start  || "").trim(),
                      end:   (surfStdHoles[0]?.fills[0]?.finish || "").trim(),
                      minutes: String(surfStdHoles[0]?.fills[0]?.deltaMin ?? "") },
                "2": { start: (surfStdHoles[0]?.fills[1]?.start  || "").trim(),
                      end:   (surfStdHoles[0]?.fills[1]?.finish || "").trim(),
                      minutes: String(surfStdHoles[0]?.fills[1]?.deltaMin ?? "") },
                "3": { start: (surfStdHoles[0]?.fills[2]?.start  || "").trim(),
                      end:   (surfStdHoles[0]?.fills[2]?.finish || "").trim(),
                      minutes: String(surfStdHoles[0]?.fills[2]?.deltaMin ?? "") },
              },
              // Hole 2 -> 10_2Start*/End*/Minutes*, Average102
              run2: {
                "1": { start: (surfStdHoles[1]?.fills[0]?.start  || "").trim(),
                      end:   (surfStdHoles[1]?.fills[0]?.finish || "").trim(),
                      minutes: String(surfStdHoles[1]?.fills[0]?.deltaMin ?? "") },
                "2": { start: (surfStdHoles[1]?.fills[1]?.start  || "").trim(),
                      end:   (surfStdHoles[1]?.fills[1]?.finish || "").trim(),
                      minutes: String(surfStdHoles[1]?.fills[1]?.deltaMin ?? "") },
                "3": { start: (surfStdHoles[1]?.fills[2]?.start  || "").trim(),
                      end:   (surfStdHoles[1]?.fills[2]?.finish || "").trim(),
                      minutes: String(surfStdHoles[1]?.fills[2]?.deltaMin ?? "") },
              },
              // Hole 3 -> 10_3Start*/End*/Minutes*, Average103
              run3: {
                "1": { start: (surfStdHoles[2]?.fills[0]?.start  || "").trim(),
                      end:   (surfStdHoles[2]?.fills[0]?.finish || "").trim(),
                      minutes: String(surfStdHoles[2]?.fills[0]?.deltaMin ?? "") },
                "2": { start: (surfStdHoles[2]?.fills[1]?.start  || "").trim(),
                      end:   (surfStdHoles[2]?.fills[1]?.finish || "").trim(),
                      minutes: String(surfStdHoles[2]?.fills[1]?.deltaMin ?? "") },
                "3": { start: (surfStdHoles[2]?.fills[2]?.start  || "").trim(),
                      end:   (surfStdHoles[2]?.fills[2]?.finish || "").trim(),
                      minutes: String(surfStdHoles[2]?.fills[2]?.deltaMin ?? "") },
              },
            },
          },

          // Step 4 Surface comments (maps to 10Comment1 in backend)
          step4_surface_comments: (surfStdComments || "").trim(),

          // --- PAGE 10: Step 5 — Modified Method (SURFACE) ---
          // Backend expects: modifiedSurface.holes[{ A:{start,end,minutes?}, B:{...}, C:{...}, D:{...} }]
          modifiedSurface: {
            holes: (surfModHoles || []).slice(0, 3).map(hole => {
              const b = hole.bands || [];
              const minutesOrBlank = (v: any) =>
                typeof v === "number" && Number.isFinite(v) ? String(Math.round(v)) : "";

              return {
                A: {
                  start:   (b[0]?.start  || "").trim(),
                  end:     (b[0]?.finish || "").trim(),
                  minutes: minutesOrBlank(b[0]?.tn),   // optional; backend will compute if blank
                },
                B: {
                  start:   (b[1]?.start  || "").trim(),
                  end:     (b[1]?.finish || "").trim(),
                  minutes: minutesOrBlank(b[1]?.tn),
                },
                C: {
                  start:   (b[2]?.start  || "").trim(),
                  end:     (b[2]?.finish || "").trim(),
                  minutes: minutesOrBlank(b[2]?.tn),
                },
                D: {
                  start:   (b[3]?.start  || "").trim(),
                  end:     (b[3]?.finish || "").trim(),
                  minutes: minutesOrBlank(b[3]?.tn),
                },
              };
            }),
          },

          step5_surface_comments: (surfaceStep5Comments || "").trim(),

          // Conclusion — page end
          slopeProposed: (slopeProposed || "").trim(),     // 4.0, typed by the assessor
          minDistances:  sepDistancesMet ? "✔" : "",         // show a tick if true, blank if false


          // --- Conclusion (Page 4) ---
          conclusion: {
            // 4.0 slope of proposed infiltration / treatment area (not the 3.0 site slope)
            slope: (slopeProposed || "").trim(),

            // checkbox “All minimum separation distances met”
            separation_ok: !!sepDistancesMet,

            // free text “Depth of unsaturated soil… (m)”
            unsaturated_depth: (unsatDepth || "").trim(),

            // PVs — use your computed UI values
            surface_pv:  sPV  != null ? sPV.toFixed(2)  : "",
            subsurface_pv: ssPV != null ? ssPV.toFixed(2) : "",

            // “Suitable / Not Suitable for Development”
            suitable: !!suitableForDevelopment,
            // (optional) not_suitable: !suitableForDevelopment,

            // “Identify all suitable options” (1/2/3)
            options: {
              option1: !!optSepticTank,   // Septic tank system
              option2: !!optSecondary,    // Secondary + polishing filter
              option3: !!optTertiary,     // Tertiary + infiltration/treatment area
            },

            // “Discharge Route” big text box
            discharge_route: (dischargeRoute || "").trim(),
          },

          selected: {
            propose_to_install: (dwwtsInstall || "").trim(),
            discharge_to: (dwwtsDischargeTo || "").trim(),
            invert_level_m: (invertLevel || "").trim(),
            site_specific_conditions: (siteSpecificConditions || "").trim(),
          },

          // --- PAGE 6: Treatment System Details ---
          treatment: {
            // Chapter 7 — Septic Tank + percolation area (left column)
            septic: {
              tank_m3:        (septTankCapacity || "").trim(),
              no_trenches:    (septPercNoTrenches || "").trim(),
              length_m:       (septPercLenTrenches || "").trim(),
              invert_level_m: (septPercInvertLevel || "").trim(),
            },

            // Mounded percolation area (right column)
            mounded: {
              no_trenches:    (septMoundNoTrenches ?? "").toString().trim(), // if you have this state
              length_m:       (septMoundLenTrenches || "").trim(),
              invert_level_m: (septMoundInvertLevel ?? "").toString().trim(), // if you have this state
            },

            // CH 8–10 left table (what the backend expects now)
            secondary: {
              // Sand/Soil row
              sandsoil: {
                area_m2:     (secSandSoil?.area  ?? "").toString().trim(),
                depthFilter: (secSandSoil?.depth ?? "").toString().trim(),
                invert:      (secSandSoil?.invert?? "").toString().trim(),
              },
              // If you have these states, they’ll fill rows 2–4. If not, the backend will just ignore blanks.
              soil: {
                area_m2:     (secSoil?.area      ?? "").toString().trim(),
                depthFilter: (secSoil?.depth     ?? "").toString().trim(),
                invert:      (secSoil?.invert    ?? "").toString().trim(),
              },
              wetland: {
                area_m2:     (secWetland?.area   ?? "").toString().trim(),
                depthFilter: (secWetland?.depth  ?? "").toString().trim(),
                invert:      (secWetland?.invert ?? "").toString().trim(),
              },
              other: {
                area_m2:     (secOther?.area     ?? "").toString().trim(),
                depthFilter: (secOther?.depth    ?? "").toString().trim(),
                invert:      (secOther?.invert   ?? "").toString().trim(),
              },
            },

            // (Keeping this is harmless, but the backend uses `secondary` for the table now)
            // polishing_filter: { ... }  // ← safe to remove if you want

            // Packaged secondary (right column)
            packaged_secondary: {
              type:                   (packagedType || "").trim(),
              capacity_pe:            (packagedPE || "").trim(),
              primary_compartment_m3: (primaryCompartment || "").trim(),
            },

            // Polishing filter options block (mid page)
            options: {
              pf_surface_area_m2:   (pfSurfaceArea || "").trim(),     // writes both name variants
              opt3_trench_length_m: (optGravityLength || "").trim(),
              opt4_low_pressure_m:  (optLowPressureLength || "").trim(),
              opt5_surface_area_m2: (optDripArea || "").trim(),
              sa1:                  (optDirectArea || "").trim(),
              sa2:                  (optPumpedArea || "").trim(),
              // sa3:               (optThirdArea  || "").trim(),      // add if you have it in the UI
            },

            // Section 10.2 — Tertiary treatment (bottom-left)
            tertiary: {
              purpose:     (tertiaryPurpose || "").trim(),
              performance: (tertiaryPerformance || "").trim(),
              design:      (tertiaryDesign || "").trim(),
            },

            // Discharge Route (bottom strip)
            discharge: {
              groundwater:     dischargeChoice === "groundwater",
              surface_water:   dischargeChoice === "surface",
              hydraulic_lr:    (hydraulicLoadingRate || "").trim(),
              surface_area_m2: (surfaceAreaM2 || "").trim(),
              discharge_rate:  (dischargeRateM3hr || "").trim(),
            },
          },

          qa: {
            installation_commissioning: (qaInstall || "").trim(),
            ongoing_maintenance: (qaMaintenance || "").trim(),
          },


          assessor: {
            company: (assCompany || "").trim(),
            prefix: normalizePrefix(assPrefix),   // never a name typed into the Prefix box
            first_name: (assFirst || "").trim(),
            surname: (assSurname || "").trim(),
            address: (assAddress || "").trim(),
            qualifications: (assQuals || "").trim(),
            date_of_report: (assDateOfReport || todayDMY()),
            phone: (assPhone || "").trim(),
            email: (assEmail || "").trim(),
            indemnity_insurance_number: (assIndemnity || "").trim(),
            signature_url: signatureUrl || "",
            // The user's logo (Settings): top right of the cover and top left of every page.
            logo_url: assessorDefaults?.logoUrl || "",
          },



          maps: (imgUris || []).slice(0, 10),
          // Photos with their labels; when none are labelled yet the generator treats
          // them all as "Other". Falls back to the plain URLs if the entries haven't loaded.
          photos: photoEntries.length ? photoEntries : photoUrls,
          plans: planPdfUrls,
      };

      if (!isOnline() && Platform.OS === "web") {
        // The website has no background queue to send it later.
        Alert.alert("No connection", "Generating the report needs an internet connection. Everything you've entered is kept in this tab; try again once you're back online.");
        return;
      }
      if (!isOnline()) {
        await enqueue('report_generate', { ...reportPayload, __reportId: currentReportId }, currentReportId);
        Alert.alert(
          "Report queued",
          "You're offline, so this report will be generated and emailed automatically as soon as you're back in signal. You don't need to do anything else."
        );
        return;
      }

      const res = await fetch(`${API_BASE}/generate_report_from_app`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportPayload),
      });

      const json = await res.json();
      // --- show backend layer summaries (so you can read them on the phone) ---
      if (json?.layer_debug) {
        const pretty = JSON.stringify(json.layer_debug, null, 2);
        Alert.alert("Layer debug", pretty);
      }

      
      
      if (json?.status === "ok" && json?.url) {
        const pdfUrl = `${API_BASE}${json.url}`;

        // Show success message with email status
        let message = `Opening:\n${pdfUrl}`;
        if (json?.email_sent) {
          message += `\n\n✓ Report emailed to ${assEmail}`;
        } else if (assEmail) {
          message += `\n\nNote: Email sending not configured on server`;
        }

        if (Platform.OS === "web") {
          // A browser blocks a new tab opened after the request comes back,
          // so the PDF opens from a button press instead.
          Alert.alert(
            "Report ready",
            json?.email_sent ? `Emailed to ${assEmail}.` : "Your PDF report has been generated.",
            [
              { text: "Close", style: "cancel" },
              { text: "Open PDF", onPress: () => { Linking.openURL(pdfUrl); } },
            ],
          );
        } else {
          Alert.alert("Report created (Page 1)", message);
          Linking.openURL(pdfUrl);
        }
      } else {
        Alert.alert("Report error", JSON.stringify(json, null, 2));
      }
    } catch (err: any) {
      Alert.alert("Network error", String(err?.message || err));
    }
  }

  // Load a report from the database
  async function loadReport(report: Report) {
    try {
      // Load all the data from the report
      const clientInfo = report.client_info || {};
      setSiteLocation(clientInfo.siteLocation || '');
      setClientName(clientInfo.clientName || '');
      setBedrooms(clientInfo.bedrooms || '');
      setResidents(clientInfo.residents || '');
      setWaterSupply(clientInfo.waterSupply || null);
      setPrivateWellDetail(clientInfo.privateWellDetail || null);
      setFileRef(clientInfo.fileRef || '');
      setPrefix(clientInfo.prefix || '');
      setFirstName(clientInfo.firstName || '');
      setSurname(clientInfo.surname || '');
      setAddress(clientInfo.address || '');
      setPeComments(clientInfo.peComments || '');
      setDevelopmentType(clientInfo.developmentType || null);
      setPopulationEquivalent(clientInfo.populationEquivalent || '');

      const deskStudy = report.desk_study || {};
      setSoilType(deskStudy.soilType || '');
      setSubsoilType(deskStudy.subsoilType || '');
      setBedrockType(deskStudy.bedrockType || '');
      setAquiferCategory(deskStudy.aquiferCategory || null);
      setAquiferCode(deskStudy.aquiferCode || '');
      setVulnerability(deskStudy.vulnerability || null);
      setVulnerabilityGsiLabel(deskStudy.vulnerabilityGsiLabel || '');
      setGwBody(deskStudy.gwBody || '');
      setGwStatus(deskStudy.gwStatus || null);
      setNearbySupply(deskStudy.nearbySupply || '');
      setSpaZOC(deskStudy.spaZOC || false);
      setSpaSI(deskStudy.spaSI || false);
      setSpaSO(deskStudy.spaSO || false);
      setGwProtectionResponse(deskStudy.gwProtectionResponse || '');
      setSignificantSites(deskStudy.significantSites || '');
      setPastExperience(deskStudy.pastExperience || '');
      setDeskComments(deskStudy.deskComments || '');
      setExpectedRange(deskStudy.expectedRange || null);
      setLat(deskStudy.siteLat || '');
      setLon(deskStudy.siteLon || '');

      const visualAssessment = report.visual_assessment || {};
      setLandscapePosition(visualAssessment.landscapePosition || '');
      setSlope(visualAssessment.slope || '');
      setExistingLandUse(visualAssessment.existingLandUse || '');
      setVegIndicators(visualAssessment.vegIndicators || '');
      setSlopeComment(visualAssessment.slopeComment || '');
      setGwFlowDirection(visualAssessment.gwFlowDirection || '');
      setGroundCondition(visualAssessment.groundCondition || '');
      setSiteBoundaries(visualAssessment.siteBoundaries || '');
      setHouses250m(visualAssessment.houses250m || '');
      setRoads(visualAssessment.roads || '');
      setOutcrops(visualAssessment.outcrops || '');
      setPonding(visualAssessment.ponding || '');
      setLakes(visualAssessment.lakes || '');
      setBeachesShellfish(visualAssessment.beachesShellfish || '');
      setWetlands(visualAssessment.wetlands || '');
      setKarstFeatures(visualAssessment.karstFeatures || '');
      setWatercourses(visualAssessment.watercourses || '');
      setDrainageDitches(visualAssessment.drainageDitches || '');
      setSprings(visualAssessment.springs || '');
      setWellsText(visualAssessment.wellsText || '');
      setVisualComments(visualAssessment.visualComments || '');

      const trialHole = report.trial_hole || {};
      setTrialDepth(trialHole.trialDepth || '');
      setDepthBedrock(trialHole.depthBedrock || '');
      setDepthWaterTable(trialHole.depthWaterTable || '');
      setDepthIngress(trialHole.depthIngress || '');
      setRockType(trialHole.rockType || '');
      setExcavDate(trialHole.excavDate || '');
      setExcavTime(trialHole.excavTime || '');
      setExamDate(trialHole.examDate || '');
      setExamTime(trialHole.examTime || '');
      setThClassificationCol(trialHole.thClassificationCol || '');
      setThDilatancyCol(trialHole.thDilatancyCol || '');
      setThStructureCol(trialHole.thStructureCol || '');
      setThCompactnessCol(trialHole.thCompactnessCol || '');
      setThColourCol(trialHole.thColourCol || '');
      setThFlowpathsCol(trialHole.thFlowpathsCol || '');
      setSoilLayers(Array.isArray(trialHole.soilLayers) ? trialHole.soilLayers : []);

      const subsurfacePerc = report.subsurface_perc || {};
      setLikelySubsurfaceP(subsurfacePerc.likelySubsurfaceP || '');
      if (subsurfacePerc.percHoles) setPercHoles(subsurfacePerc.percHoles);
      if (subsurfacePerc.step4Comments) setStep4Comments(subsurfacePerc.step4Comments);

      // Load and recompute standard method to ensure decimal precision
      if (subsurfacePerc.stdHoles) {
        recomputeStandard(subsurfacePerc.stdHoles);
      }

      // Load and recompute modified method to ensure decimal precision
      if (subsurfacePerc.modHoles) {
        recomputeModified(subsurfacePerc.modHoles);
      }

      const surfacePerc = report.surface_perc || {};
      setLikelySurfaceP(surfacePerc.likelySurfaceP || '');
      if (surfacePerc.surfStdComments) setSurfStdComments(surfacePerc.surfStdComments);
      if (surfacePerc.surfaceStep5Comments) setSurfaceStep5Comments(surfacePerc.surfaceStep5Comments);

      // Load and recompute T100 to ensure decimal precision
      if (surfacePerc.surfHoles) {
        recomputeSurfaceT100(surfacePerc.surfHoles);
      }

      // Load and recompute standard method to ensure decimal precision
      if (surfacePerc.surfStdHoles) {
        recomputeSurfStandard(surfacePerc.surfStdHoles);
      }

      // Load and recompute modified method to ensure decimal precision
      if (surfacePerc.surfModHoles) {
        recomputeSurfModified(surfacePerc.surfModHoles);
      }

      const treatmentSystems = report.treatment_systems || {};
      setSeptTankCapacity(treatmentSystems.septTankCapacity || '');
      setSeptPercNoTrenches(treatmentSystems.septPercNoTrenches || '');
      setSeptPercLenTrenches(treatmentSystems.septPercLenTrenches || '');
      setSeptPercInvertLevel(treatmentSystems.septPercInvertLevel || '');
      setSeptMoundNoTrenches(treatmentSystems.septMoundNoTrenches || '');
      setSeptMoundLenTrenches(treatmentSystems.septMoundLenTrenches || '');
      setSeptMoundInvertLevel(treatmentSystems.septMoundInvertLevel || '');
      if (treatmentSystems.secSandSoil) setSecSandSoil(treatmentSystems.secSandSoil);
      if (treatmentSystems.secSoil) setSecSoil(treatmentSystems.secSoil);
      if (treatmentSystems.secWetland) setSecWetland(treatmentSystems.secWetland);
      if (treatmentSystems.secOther) setSecOther(treatmentSystems.secOther);
      setPackagedType(treatmentSystems.packagedType || '');
      setPackagedPE(treatmentSystems.packagedPE || '');
      setPrimaryCompartment(treatmentSystems.primaryCompartment || '');
      setPfSurfaceArea(treatmentSystems.pfSurfaceArea || '');
      setOptDirectArea(treatmentSystems.optDirectArea || '');
      setOptPumpedArea(treatmentSystems.optPumpedArea || '');
      setOptGravityLength(treatmentSystems.optGravityLength || '');
      setOptLowPressureLength(treatmentSystems.optLowPressureLength || '');
      setOptDripArea(treatmentSystems.optDripArea || '');
      setTertiaryPurpose(treatmentSystems.tertiaryPurpose || '');
      setTertiaryPerformance(treatmentSystems.tertiaryPerformance || '');
      setTertiaryDesign(treatmentSystems.tertiaryDesign || '');
      setDischargeChoice(treatmentSystems.dischargeChoice || '');
      setHydraulicLoadingRate(treatmentSystems.hydraulicLoadingRate || '');
      setSurfaceAreaM2(treatmentSystems.surfaceAreaM2 || '');
      setDischargeRateM3hr(treatmentSystems.dischargeRateM3hr || '');

      const selectedDwwts = report.selected_dwwts || {};
      setDwwtsInstall(selectedDwwts.dwwtsInstall || '');
      setPolishingConstruction(selectedDwwts.polishingConstruction || null);
      setTreatmentUnit(selectedDwwts.treatmentUnit ?? 'BAF');
      setDwwtsDischargeTo(selectedDwwts.dwwtsDischargeTo || '');
      setInvertLevel(selectedDwwts.invertLevel || '');
      setSiteSpecificConditions(selectedDwwts.siteSpecificConditions || '');

      const conclusion = report.conclusion || {};
      // Reports saved before 4.0 had its own slope stored the shared value
      // as `slope`; carry it over once so their PDFs don't lose it.
      setSlopeProposed(conclusion.slopeProposed ?? conclusion.slope ?? '');
      setUnsatDepth(conclusion.unsatDepth || '');
      setSepDistancesMet(conclusion.sepDistancesMet || false);
      setDischargeRoute(conclusion.dischargeRoute || '');
      setSuitableForDevelopment(conclusion.suitableForDevelopment || false);
      setOptSepticTank(conclusion.optSepticTank || false);
      setOptSecondary(conclusion.optSecondary || false);
      setOptTertiary(conclusion.optTertiary || false);

      const qualityAssurance = report.quality_assurance || {};
      setQaInstall(qualityAssurance.qaInstall || '');
      setQaMaintenance(qualityAssurance.qaMaintenance || '');

      const siteAssessor = report.site_assessor || {};
      setAssCompany(siteAssessor.assCompany || '');
      setAssPrefix(siteAssessor.assPrefix || '');
      setAssFirst(siteAssessor.assFirst || '');
      setAssSurname(siteAssessor.assSurname || '');
      setAssAddress(siteAssessor.assAddress || '');
      setAssQuals(siteAssessor.assQuals || '');
      setAssDateOfReport(siteAssessor.assDateOfReport || '');
      setAssPhone(siteAssessor.assPhone || '');
      setAssEmail(siteAssessor.assEmail || '');
      setAssIndemnity(siteAssessor.assIndemnity || '');

      setPhotoUrls(report.photo_urls || []);
      setImgUris(report.map_urls || []);

      getDeskStudyStatus(report.id).then(({ status }) => setDeskStudyStatus(status));

      // Show any maps already saved on this device straight away, then fetch
      // copies of any that aren't (e.g. prepared before this update, or on
      // another device) while there's signal.
      setLocalMapUris({});
      getLocalMapIndex(report.id).then((index) => {
        if (openReportIdRef.current === report.id || openReportIdRef.current === null) setLocalMapUris(index);
      });
      syncLocalMaps(report.id, report.map_urls || []);

      // Set the current report ID
      setCurrentReportId(report.id);
      setCurrentReportStatus(report.status || 'draft');

      // Land on the Report Overview hub
      setCurrentSection(null);
      setCurrentTab('maps');
    } catch (error) {
      console.error('Failed to load report:', error);
      Alert.alert('Error', 'Failed to load report data');
    }
  }

  // Load assessor defaults from user profile
  async function loadAssessorDefaults() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('assessor_defaults')
        .eq('id', user.id)
        .single();

      if (!error && data?.assessor_defaults) {
        setAssessorDefaults(data.assessor_defaults);
        AsyncStorage.setItem(ASSESSOR_DEFAULTS_CACHE, JSON.stringify(data.assessor_defaults)).catch(() => {});
        return;
      }
      throw error ?? new Error('no assessor defaults');
    } catch (err) {
      // Offline (or the profile couldn't be read): use the copy from the last
      // time it loaded, so a report generated with no signal still carries the
      // user's logo and details.
      try {
        const cached = await AsyncStorage.getItem(ASSESSOR_DEFAULTS_CACHE);
        if (cached) setAssessorDefaults(JSON.parse(cached));
      } catch {}
      console.warn('Using cached assessor defaults:', err);
    }
  }

  // Apply assessor defaults to current form
  function applyAssessorDefaults(defaults: AssessorDefaults) {
    setAssCompany(defaults.company || '');
    setAssPrefix(defaults.prefix || '');
    setAssFirst(defaults.firstName || '');
    setAssSurname(defaults.surname || '');
    setAssAddress(defaults.address || '');
    setAssQuals(defaults.qualifications || '');
    setAssPhone(defaults.phone || '');
    setAssEmail(defaults.email || '');
    setAssIndemnity(defaults.indemnity || '');
    if (defaults.signatureUrl) {
      setSignatureUrl(defaults.signatureUrl);
    }
  }

  // Create a new blank report
  async function handleNewReport() {
    try {
      const { data, error } = await createReport();

      if (error) {
        Alert.alert('Error', 'Failed to create new report');
        return;
      }

      if (data) {
        // Clear all form fields
        setSiteLocation('');
        setClientName('');
        setBedrooms('');
        setResidents('');
        setWaterSupply(null);
        setPrivateWellDetail(null);
        setFileRef('');
        setPrefix('');
        setFirstName('');
        setSurname('');
        setAddress('');
        setPeComments('');
        setDevelopmentType(null);
        setPopulationEquivalent('');
        setSoilType('');
        setSubsoilType('');
        setBedrockType('');
        setAquiferCategory(null);
        setAquiferCode('');
        setVulnerability(null);
        setVulnerabilityGsiLabel('');
        setGwBody('');
        setGwStatus(null);
        setNearbySupply('');
        setSpaZOC(false);
        setSpaSI(false);
        setSpaSO(false);
        setGwProtectionResponse('');
        setSignificantSites('');
        setPastExperience('');
        setDeskComments('');
        setExpectedRange(null);
        setLandscapePosition('');
        setSlope('');
        setSlopeProposed('');
        setExistingLandUse('');
        setVegIndicators('');
        setSlopeComment('');
        setGwFlowDirection('');
        setGroundCondition('');
        setSiteBoundaries('');
        setHouses250m('');
        setRoads('');
        setOutcrops('');
        setPonding('');
        setLakes('');
        setBeachesShellfish('');
        setWetlands('');
        setKarstFeatures('');
        setWatercourses('');
        setDrainageDitches('');
        setSprings('');
        setWellsText('');
        setVisualComments('');
        setThClassificationCol('');
        setThDilatancyCol('');
        setThStructureCol('');
        setThCompactnessCol('');
        setThColourCol('');
        setThFlowpathsCol('');
        setLikelySubsurfaceP('');
        setLikelySurfaceP('');
        setPhotoUrls([]);
        setImgUris([]);
        setDeskStudyStatus('none');
        setLocalMapUris({});
        setLat('');
        setLon('');

        // Reset Trial Hole data
        setTrialDepth('');
        setDepthBedrock('');
        setDepthWaterTable('');
        setDepthIngress('');
        setRockType('');
        setExcavDate('');
        setExcavTime('');
        setExamDate('');
        setExamTime('');
        setSoilLayers([]);
        setTrialHoleEvaluation('');

        // Reset Subsurface Perc data
        setPercHoles([
          { id: "1", topDepth: "", baseDepth: "", holeDepth: "", dimensions: "",
            preSoak1Date: "", preSoak1Time: "", preSoak2Date: "", preSoak2Time: "",
            testDate: "", fillTime: "", waterLevelTime: "", t100: "" },
          { id: "2", topDepth: "", baseDepth: "", holeDepth: "", dimensions: "",
            preSoak1Date: "", preSoak1Time: "", preSoak2Date: "", preSoak2Time: "",
            testDate: "", fillTime: "", waterLevelTime: "", t100: "" },
          { id: "3", topDepth: "", baseDepth: "", holeDepth: "", dimensions: "",
            preSoak1Date: "", preSoak1Time: "", preSoak2Date: "", preSoak2Time: "",
            testDate: "", fillTime: "", waterLevelTime: "", t100: "" },
        ]);
        setStdHoles([
          newStandardHole("1"),
          newStandardHole("2"),
          newStandardHole("3"),
        ]);
        setStdResult(null);
        setModHoles([
          mkModHole("1"),
          mkModHole("2"),
          mkModHole("3"),
        ]);
        setModResult(null);
        setStep4Comments('');

        // Reset Surface Perc data
        setSurfHoles([
          mkSurfHole("1"),
          mkSurfHole("2"),
          mkSurfHole("3")
        ]);
        setSurfAvgT100(null);
        setSurfStdHoles([
          mkSurfStdHole("1"),
          mkSurfStdHole("2"),
          mkSurfStdHole("3"),
        ]);
        setSurfStdResult(null);
        setSurfStdComments('');
        setSurfModHoles([
          mkSurfModHole("1"),
          mkSurfModHole("2"),
          mkSurfModHole("3"),
        ]);
        setSurfModResult(null);
        setSurfaceStep5Comments('');

        // Reset Conclusion data
        setSepDistancesMet(false);
        setUnsatDepth('');
        setSuitableForDevelopment(false);
        setOptSepticTank(false);
        setOptSecondary(false);
        setOptTertiary(false);
        setDischargeRoute('');
        setCDirty({
          unsatDepth: false,
          sepDistancesMet: false,
          suitable: false,
          discharge: false,
        });

        // Reset Selected DWWTS data
        setDwwtsInstall('');
        setPolishingConstruction(null);
        setTreatmentUnit('BAF');
        setDwwtsDischargeTo('');
        setInvertLevel('');
        setSiteSpecificConditions('');

        // Reset Treatment Systems data
        setSeptTankCapacity('');
        setSeptPercNoTrenches('');
        setSeptPercLenTrenches('');
        setSeptPercInvertLevel('');
        setSeptMoundNoTrenches('');
        setSeptMoundLenTrenches('');
        setSeptMoundInvertLevel('');
        setSecSandSoil({ area: "", depth: "", invert: "" });
        setSecSoil({ area: "", depth: "", invert: "" });
        setSecWetland({ area: "", depth: "", invert: "" });
        setSecOther({ area: "", depth: "", invert: "" });
        setPackagedType('');
        setPackagedPE('');
        setPrimaryCompartment('0');
        setPfSurfaceArea('');
        setOptDirectArea('');
        setOptPumpedArea('');
        setOptGravityLength('');
        setOptLowPressureLength('');
        setOptDripArea('');
        setTertiaryPurpose('');
        setTertiaryPerformance('');
        setTertiaryDesign('');
        setDischargeChoice('groundwater');
        setHydraulicLoadingRate('');
        setSurfaceAreaM2('');
        setDischargeRateM3hr('');

        // Reset Quality Assurance data
        setQaInstall("");          // filled with the standard wording once a system is chosen
        setQaMaintenance("");

        // Reset Site Assessor data (except defaults which will be applied below)
        setSignatureUrl(null);
        setPlanPdfUrls([]);
        setAssDateOfReport(todayDMY());

        // Apply assessor defaults if available
        if (assessorDefaults) {
          applyAssessorDefaults(assessorDefaults);
        }

        setCurrentReportId(data.id);
        setCurrentReportStatus('draft');
        setCurrentSection(null);
        setCurrentTab('maps');
      }
    } catch (error) {
      console.error('Failed to create report:', error);
      Alert.alert('Error', 'Failed to create new report');
    }
  }

  // Generate maps function
  async function generateMaps() {
    // This is the "Prepare for site" step: desk study (GSI/EPA) lookups +
    // map generation need a connection. If we don't have one, don't throw a
    // raw network-error banner — mark it pending so it auto-fetches as soon
    // as signal returns (see the reconnect effect below) and let the
    // engineer carry on with everything else offline in the meantime.
    if (!isOnline()) {
      setImgErr(null);
      if (currentReportId && lat && lon) {
        await markDeskStudyPending(currentReportId, lat, lon);
        setDeskStudyStatus('pending');
      } else {
        Alert.alert(
          "You're offline",
          "Enter the site coordinates now and the desk study will be fetched automatically once you're back in signal."
        );
      }
      return;
    }

    setImgErr(null);
    const myKey = currentReportId ?? "";
    const myLat = lat, myLon = lon;
    const myToken = ++generationTokenRef.current;
    const stillOpen = () => (openReportIdRef.current ?? "") === myKey;
    setGeneratingKey(myKey);
    setLoading(true);
    try {
      // Get current user ID for organizing uploaded maps
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // 1) Generate the map images — allow up to 5 minutes (maps call several external APIs)
      const mapsUrl = `${API_BASE}/generate_maps?lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&user_id=${encodeURIComponent(userId)}`;

      const mapsAbort = new AbortController();
      const mapsTimer = setTimeout(() => mapsAbort.abort(), 5 * 60 * 1000);
      let res: Response;
      try {
        res = await fetch(mapsUrl, { signal: mapsAbort.signal });
      } finally {
        clearTimeout(mapsTimer);
      }
      const json = await res.json();
      // A server error used to leave the maps area silently empty.
      if (!res.ok || !Array.isArray(json?.maps)) {
        throw new Error(json?.detail ? `Map generation failed: ${json.detail}` : `Map generation failed (HTTP ${res.status})`);
      }
      // The engineer opened a different report while this was running: don't
      // pour these maps and desk-study answers into that other report's form.
      // Mark the original "pending" instead, so its desk study is fetched
      // again automatically the next time it's opened (see the effect above).
      if (!stillOpen()) {
        if (myKey) {
          autoDeskStudyTriedRef.current.delete(myKey);
          await markDeskStudyPending(myKey, myLat, myLon);
        }
        return;
      }

      const cacheBust = Date.now();
      const uris = (json?.maps ?? []).map(
        (p: string) => `${p}?_t=${cacheBust}`
      );
      setImgUris(uris); // store all image URLs

      // "Prepare for site": also save each map on the device so it can be
      // viewed and zoomed on site with no signal. Runs in the background so
      // desk-study prefill below isn't held up by the downloads.
      if (currentReportId) syncLocalMaps(currentReportId, uris);

      // Store layer summaries/descriptions
      const summaries = json?.layer_summaries ?? {};
      const descriptions: Record<string, string> = {};

      // Extract description for each layer
      if (summaries.soils?.description) {
        descriptions.soils = summaries.soils.description;
      }
      if (summaries.subsoils?.description) {
        descriptions.subsoils = summaries.subsoils.description;
      }
      if (summaries.bedrock?.description) {
        descriptions.bedrock = summaries.bedrock.description;
      }
      if (summaries.aquifer?.description) {
        descriptions.aquifer = summaries.aquifer.description;
      }
      if (summaries.vulnerability?.description) {
        descriptions.vulnerability = summaries.vulnerability.description;
      }
      if (summaries.groundwater_body?.description) {
        descriptions.groundwater_body = summaries.groundwater_body.description;
      }
      if (summaries.groundwater_flow?.description) {
        descriptions.groundwater_flow = summaries.groundwater_flow.description;
      }

      setMapDescriptions(descriptions);

      // Layers the backend couldn't get data for (the map itself carries a red
      // "MAP DATA UNAVAILABLE" banner) — say so rather than show an empty map.
      const mapWarnings: Record<string, string[]> = json?.map_warnings ?? {};
      const warned = Object.values(mapWarnings).flat();
      if (warned.length) {
        Alert.alert(
          "Some map data unavailable",
          warned.join("\n\n") + "\n\nTry Prepare for site again later, or check the GSI map viewer.",
        );
      }

      // 2) Prefill desk-study fields from live GSI summaries
      await prefillFromLayerSummaries(lat, lon, summaries);

      if (currentReportId) {
        await markDeskStudyReady(currentReportId, lat, lon);
        setDeskStudyStatus('ready');
      }
    } catch (e: any) {
      if (stillOpen()) {
        setImgErr(String(e?.message ?? e));
        setImgUris([]);
        setMapDescriptions({});
      }
    } finally {
      if (generationTokenRef.current === myToken) {
        setLoading(false);
        setGeneratingKey(null);
      }
    }
  }


  // Function to handle tab change with auto-scrolling
  const handleTabChange = (tab: typeof currentTab, tabIndex: number) => {
    setCurrentTab(tab);

    // Auto-scroll for all tabs after "photos" (index 2+)
    if (tabIndex >= 2 && tabScrollViewRef.current && tabButtonRefs.current[tabIndex]) {
      // Use a small delay to ensure the button is rendered
      setTimeout(() => {
        const buttonView = tabButtonRefs.current[tabIndex];
        const scrollView = tabScrollViewRef.current;

        if (buttonView && scrollView) {
          buttonView.measureLayout(
            scrollView as any,
            (x, y, width, height) => {
              const screenWidth = Dimensions.get('window').width;
              // Calculate scroll position to center the button
              const scrollX = x - (screenWidth / 2) + (width / 2);

              scrollView.scrollTo({
                x: Math.max(0, scrollX),
                animated: true,
              });
            },
            () => {
              console.log('measureLayout failed');
            }
          );
        }
      }, 50);
    }
  };

  // Derive per-section completion from filled fields (presentational only).
  const sectionsComplete: Record<string, boolean> = {
    photos: !!(lat && lon) || imgUris.length > 0 || photoUrls.length > 0,
    clientInfo: !!(firstName || surname || siteLocation),
    deskStudy: !!(soilType || aquiferCategory || vulnerability),
    visualAssessment: !!(landscapePosition || slope),
    trialHole: !!(trialDepth || thClassificationCol),
    subsurfacePerc: !!likelySubsurfaceP,
    surfacePerc: !!likelySurfaceP,
    conclusion: !!(dischargeRoute || suitableForDevelopment || unsatDepth || slopeProposed),
    selectedDwwts: !!(dwwtsInstall || dwwtsDischargeTo),
    treatmentSystems: !!(packagedType || septTankCapacity),
    qualityAssurance: !!(qaInstall || qaMaintenance),
    siteAssessor: !!(assFirst || assSurname || assCompany),
  };

  // Open a section form. The 'photos' tile opens the combined Location/Maps/Photos view.
  const openSection = (id: SectionId) => {
    setCurrentSection(id);
    if (id === 'photos') {
      setCurrentTab('maps');
    } else {
      setCurrentTab(id as typeof currentTab);
    }
  };

  // Wrap report generation with a busy flag for the sticky button.
  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await generateReport();
    } finally {
      setGenerating(false);
    }
  };

  // Auto-save all form data locally (and queue a background sync) as the
  // engineer types — see hooks/useAutoSave.ts. flushAutoSave() forces
  // whatever's still in the debounce window to save immediately; used by
  // generateReport() below so the last few keystrokes before tapping
  // "Generate Report" are never missed.
  const flushAutoSave = useAutoSave(
    currentReportId,
    {
      clientInfo: {
        siteLocation,
        clientName,
        bedrooms,
        residents,
        waterSupply,
        privateWellDetail,
        fileRef,
        prefix,
        firstName,
        surname,
        address,
        peComments,
        developmentType,
        populationEquivalent,
      },
      deskStudy: {
        soilType,
        subsoilType,
        bedrockType,
        aquiferCategory,
        aquiferCode,
        vulnerability,
        vulnerabilityGsiLabel,
        gwBody,
        gwStatus,
        nearbySupply,
        spaZOC,
        spaSI,
        spaSO,
        gwProtectionResponse,
        significantSites,
        pastExperience,
        deskComments,
        expectedRange,
        // The site coordinates, so the report can be continued on another
        // device and pinned on the reports map (components/ReportsMap.tsx).
        siteLat: lat.trim(),
        siteLon: lon.trim(),
      },
      visualAssessment: {
        landscapePosition,
        slope,
        existingLandUse,
        vegIndicators,
        slopeComment,
        gwFlowDirection,
        groundCondition,
        siteBoundaries,
        houses250m,
        roads,
        outcrops,
        ponding,
        lakes,
        beachesShellfish,
        wetlands,
        karstFeatures,
        watercourses,
        drainageDitches,
        springs,
        wellsText,
        visualComments,
      },
      trialHole: {
        trialDepth,
        depthBedrock,
        depthWaterTable,
        depthIngress,
        rockType,
        excavDate,
        excavTime,
        examDate,
        examTime,
        thClassificationCol,
        thDilatancyCol,
        thStructureCol,
        thCompactnessCol,
        thColourCol,
        thFlowpathsCol,
        soilLayers,
      },
      subsurfacePerc: {
        percHoles,
        stdHoles,
        stdResult,
        step4Comments,
        modHoles,
        modResult,
        likelySubsurfaceP,
      },
      surfacePerc: {
        surfHoles,
        surfStdHoles,
        surfStdResult,
        surfStdComments,
        surfModHoles,
        surfModResult,
        surfaceStep5Comments,
        likelySurfaceP,
      },
      treatmentSystems: {
        septTankCapacity,
        septPercNoTrenches,
        septPercLenTrenches,
        septPercInvertLevel,
        septMoundNoTrenches,
        septMoundLenTrenches,
        septMoundInvertLevel,
        secSandSoil,
        secSoil,
        secWetland,
        secOther,
        packagedType,
        packagedPE,
        primaryCompartment,
        pfSurfaceArea,
        optDirectArea,
        optPumpedArea,
        optGravityLength,
        optLowPressureLength,
        optDripArea,
        tertiaryPurpose,
        tertiaryPerformance,
        tertiaryDesign,
        dischargeChoice,
        hydraulicLoadingRate,
        surfaceAreaM2,
        dischargeRateM3hr,
      },
      selectedDwwts: {
        dwwtsInstall,
        dwwtsDischargeTo,
        invertLevel,
        siteSpecificConditions,
        polishingConstruction,
        treatmentUnit,
      },
      conclusion: {
        slopeProposed,
        unsatDepth,
        sepDistancesMet,
        dischargeRoute,
        suitableForDevelopment,
        optSepticTank,
        optSecondary,
        optTertiary,
      },
      qualityAssurance: {
        qaInstall,
        qaMaintenance,
      },
      siteAssessor: {
        assCompany,
        assPrefix,
        assFirst,
        assSurname,
        assAddress,
        assQuals,
        assDateOfReport,
        assPhone,
        assEmail,
        assIndemnity,
      },
      photoUrls,
      mapUrls: imgUris,
    },
    !!session // Only auto-save when user is logged in
  );

  // Save / back on a section form: force-save whatever's still in the
  // autosave debounce window *before* leaving, rather than relying on the
  // 600ms timer landing afterwards — so Save saves every time, even if the
  // app is closed straight after.
  const saveAndCloseSection = async () => {
    await flushAutoSave();
    setCurrentSection(null);
  };

  // The pages, shared by the phone layout and the website's desktop layout.
  const reportsBody = (
    <MyReportsTab
      onLoadReport={(report) => { loadReport(report); setMainView('currentReport'); }}
      onNewReport={() => { handleNewReport(); setMainView('currentReport'); }}
      currentReportId={currentReportId}
    />
  );
  const settingsBody = (
    <SettingsTab
      onClose={() => setMainView('myReports')}
      onSave={(defaults) => {
        setAssessorDefaults(defaults);
        AsyncStorage.setItem(ASSESSOR_DEFAULTS_CACHE, JSON.stringify(defaults)).catch(() => {});
      }}
    />
  );
  const sectionBody = currentReportId && currentSection !== null ? (
          <View style={{ flex: 1 }}>
          {/* Location, Maps & Photos (combined) */}
          {currentSection === 'photos' && (
            <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <MapsTab
                embedded
                lat={lat}
                setLat={setLat}
                lon={lon}
                setLon={setLon}
                loading={loading && generatingKey === (currentReportId ?? "")}
                imgErr={imgErr}
                imgUris={imgUris}
                mapDescriptions={mapDescriptions}
                generateMaps={generateMaps}
                getCurrentLocation={getCurrentLocation}
                deskStudyStatus={deskStudyStatus}
                localMapUris={localMapUris}
              />
              <PhotosTab
                embedded
                reportId={currentReportId}
              />
            </KeyboardAwareScrollView>
          )}

      {/* Show Client Info Tab */}
      {currentTab === 'clientInfo' && (
        <ClientInfoTab
          fileRef={fileRef}
          setFileRef={setFileRef}
          prefix={prefix}
          setPrefix={setPrefix}
          firstName={firstName}
          setFirstName={setFirstName}
          surname={surname}
          setSurname={setSurname}
          address={address}
          setAddress={setAddress}
          siteLocation={siteLocation}
          setSiteLocation={setSiteLocation}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          residents={residents}
          setResidents={setResidents}
          populationEquivalent={populationEquivalent}
          setPopulationEquivalent={setPopulationEquivalent}
          waterSupply={waterSupply}
          setWaterSupply={setWaterSupply}
          privateWellDetail={privateWellDetail}
          setPrivateWellDetail={setPrivateWellDetail}
          developmentType={developmentType}
          setDevelopmentType={setDevelopmentType}
        />
      )}

      {/* Show Desk Study Tab */}
      {currentTab === 'deskStudy' && (
        <DeskStudyTab
          soilType={soilType}
          setSoilType={setSoilType}
          subsoilType={subsoilType}
          setSubsoilType={setSubsoilType}
          bedrockType={bedrockType}
          setBedrockType={setBedrockType}
          aquiferCategory={aquiferCategory}
          setAquiferCategory={setAquiferCategory}
          aquiferCode={aquiferCode}
          setAquiferCode={setAquiferCode}
          vulnerability={vulnerability}
          setVulnerability={setVulnerability}
          vulnerabilityGsiLabel={vulnerabilityGsiLabel}
          gwBody={gwBody}
          setGwBody={setGwBody}
          gwStatus={gwStatus}
          setGwStatus={setGwStatus}
          nearbySupply={nearbySupply}
          setNearbySupply={setNearbySupply}
          spaZOC={spaZOC}
          setSpaZOC={setSpaZOC}
          spaSI={spaSI}
          setSpaSI={setSpaSI}
          spaSO={spaSO}
          setSpaSO={setSpaSO}
          gwProtectionResponse={gwProtectionResponse}
          setGwProtectionResponse={setGwProtectionResponse}
          gwprSuggested={gwprSuggestion.value}
          gwprReason={gwprSuggestion.reason}
          significantSites={significantSites}
          setSignificantSites={setSignificantSites}
          pastExperience={pastExperience}
          setPastExperience={setPastExperience}
          deskComments={deskComments}
          setDeskComments={setDeskComments}
          deskCommentsSuggestion={suggestedDeskComment}
          pastExperienceSuggestion={suggestedPastExperience}
          expectedRange={expectedRange}
          setExpectedRange={setExpectedRange}
          expectedRangeSuggestion={suggestExpectedRange(soilType)}
        />
      )}

      {/* Show Visual Assessment Tab */}
      {currentTab === 'visualAssessment' && (
        <VisualAssessmentTab
          landscapePosition={landscapePosition}
          setLandscapePosition={setLandscapePosition}
          slope={slope}
          setSlope={setSlope}
          slopeComment={slopeComment}
          setSlopeComment={setSlopeComment}
          houses250m={houses250m}
          setHouses250m={setHouses250m}
          existingLandUse={existingLandUse}
          setExistingLandUse={setExistingLandUse}
          vegIndicators={vegIndicators}
          setVegIndicators={setVegIndicators}
          gwFlowDirection={gwFlowDirection}
          setGwFlowDirection={setGwFlowDirection}
          groundCondition={groundCondition}
          setGroundCondition={setGroundCondition}
          siteBoundaries={siteBoundaries}
          setSiteBoundaries={setSiteBoundaries}
          roads={roads}
          setRoads={setRoads}
          outcrops={outcrops}
          setOutcrops={setOutcrops}
          ponding={ponding}
          setPonding={setPonding}
          lakes={lakes}
          setLakes={setLakes}
          beachesShellfish={beachesShellfish}
          setBeachesShellfish={setBeachesShellfish}
          wetlands={wetlands}
          setWetlands={setWetlands}
          karstFeatures={karstFeatures}
          setKarstFeatures={setKarstFeatures}
          watercourses={watercourses}
          setWatercourses={setWatercourses}
          drainageDitches={drainageDitches}
          setDrainageDitches={setDrainageDitches}
          springs={springs}
          setSprings={setSprings}
          wellsText={wellsText}
          setWellsText={setWellsText}
          visualComments={visualComments}
          visualCommentsSuggestion={suggestedVisualComment}
          setVisualComments={setVisualComments}
        />
      )}

      {/* Show Trial Hole Tab */}
      {currentTab === 'trialHole' && (
        <TrialHoleTab
          trialDepth={trialDepth}
          setTrialDepth={setTrialDepth}
          depthBedrock={depthBedrock}
          setDepthBedrock={setDepthBedrock}
          depthWaterTable={depthWaterTable}
          setDepthWaterTable={setDepthWaterTable}
          depthIngress={depthIngress}
          setDepthIngress={setDepthIngress}
          rockType={rockType}
          setRockType={setRockType}
          excavDate={excavDate}
          setExcavDate={setExcavDate}
          excavTime={excavTime}
          setExcavTime={setExcavTime}
          examDate={examDate}
          setExamDate={setExamDate}
          examTime={examTime}
          setExamTime={setExamTime}
          thClassificationCol={thClassificationCol}
          setThClassificationCol={setThClassificationCol}
          thDilatancyCol={thDilatancyCol}
          setThDilatancyCol={setThDilatancyCol}
          thStructureCol={thStructureCol}
          setThStructureCol={setThStructureCol}
          thCompactnessCol={thCompactnessCol}
          setThCompactnessCol={setThCompactnessCol}
          thColourCol={thColourCol}
          setThColourCol={setThColourCol}
          thFlowpathsCol={thFlowpathsCol}
          soilLayers={soilLayers}
          setSoilLayers={setSoilLayers}
          setThFlowpathsCol={setThFlowpathsCol}
          likelySubsurfaceP={likelySubsurfaceP}
          setLikelySubsurfaceP={setLikelySubsurfaceP}
          likelySurfaceP={likelySurfaceP}
          setLikelySurfaceP={setLikelySurfaceP}
          trialHoleEvaluation={trialHoleEvaluation}
          trialHoleEvaluationSuggestion={suggestedTrialEval}
          setTrialHoleEvaluation={setTrialHoleEvaluation}
        />
      )}

      {/* Show Subsurface Percolation Tab */}
      {currentTab === 'subsurfacePerc' && (
        <SubsurfacePercTab
          percHoles={percHoles}
          setPercHoles={setPercHoles}
          updatePercHoleField={updatePercHoleField}
          stdHoles={stdHoles}
          setStdHoles={setStdHoles}
          setStdField={setStdField}
          stdResult={stdResult}
          step4Comments={step4Comments}
          step4CommentsSuggestion={suggestedStep4Sub}
          setStep4Comments={setStep4Comments}
          modHoles={modHoles}
          setModHoles={setModHoles}
          setModField={setModField}
          modResult={modResult}
          TF_FACTORS={TF_FACTORS}
        />
      )}

      {/* Show Surface Percolation Tab */}
      {currentTab === 'surfacePerc' && (
        <SurfacePercTab
          surfHoles={surfHoles}
          setSurfField={setSurfField}
          surfStdHoles={surfStdHoles}
          setSurfStdField={setSurfStdField}
          surfStdResult={surfStdResult}
          surfStdComments={surfStdComments}
          surfStdCommentsSuggestion={suggestedStep4Surf}
          setSurfStdComments={setSurfStdComments}
          surfModHoles={surfModHoles}
          setSurfModField={setSurfModField}
          surfModResult={surfModResult}
          surfaceStep5Comments={surfaceStep5Comments}
          setSurfaceStep5Comments={setSurfaceStep5Comments}
          SURF_TF_FACTORS={SURF_TF_FACTORS}
        />
      )}

      {/* Show Conclusion Tab */}
      {currentTab === 'conclusion' && (
        <ConclusionTab
          slopeProposed={slopeProposed}
          setSlopeProposed={setSlopeProposed}
          siteSlope={slope}
          sepDistancesMet={sepDistancesMet}
          setSepDistancesMet={setSepDistancesMet}
          unsatDepth={unsatDepth}
          setUnsatDepth={setUnsatDepth}
          sPV={sPV}
          ssPV={ssPV}
          suitableForDevelopment={suitableForDevelopment}
          setSuitableForDevelopment={setSuitableForDevelopment}
          optSepticTank={optSepticTank}
          setOptSepticTank={setOptSepticTank}
          optSecondary={optSecondary}
          setOptSecondary={setOptSecondary}
          optTertiary={optTertiary}
          setOptTertiary={setOptTertiary}
          dischargeRoute={dischargeRoute}
          setDischargeRoute={setDischargeRoute}
          setCDirty={setCDirty}
        />
      )}

      {/* Show Selected DWWTS Tab */}
      {currentTab === 'selectedDwwts' && (
        <SelectedDwwtsTab
          dwwtsInstall={dwwtsInstall}
          setDwwtsInstall={setDwwtsInstall}
          dwwtsDischargeTo={dwwtsDischargeTo}
          setDwwtsDischargeTo={setDwwtsDischargeTo}
          invertLevel={invertLevel}
          setInvertLevel={setInvertLevel}
          siteSpecificConditions={siteSpecificConditions}
          setSiteSpecificConditions={setSiteSpecificConditions}
          siteSpecificConditionsHint={paragraphReason}
          siteSpecificConditionsSuggestion={suggestedParagraph}
          polishingConstruction={polishingConstruction}
          setPolishingConstruction={setPolishingConstruction}
          constructionSuggestion={constructionSuggestion}
          treatmentUnit={treatmentUnit}
          setTreatmentUnit={setTreatmentUnit}
        />
      )}

      {/* Show Treatment Systems Tab */}
      {currentTab === 'treatmentSystems' && (
        <TreatmentSystemsTab
          septTankCapacity={septTankCapacity}
          setSeptTankCapacity={setSeptTankCapacity}
          septPercNoTrenches={septPercNoTrenches}
          setSeptPercNoTrenches={setSeptPercNoTrenches}
          septPercLenTrenches={septPercLenTrenches}
          setSeptPercLenTrenches={setSeptPercLenTrenches}
          septPercInvertLevel={septPercInvertLevel}
          setSeptPercInvertLevel={setSeptPercInvertLevel}
          septMoundNoTrenches={septMoundNoTrenches}
          setSeptMoundNoTrenches={setSeptMoundNoTrenches}
          septMoundLenTrenches={septMoundLenTrenches}
          setSeptMoundLenTrenches={setSeptMoundLenTrenches}
          septMoundInvertLevel={septMoundInvertLevel}
          setSeptMoundInvertLevel={setSeptMoundInvertLevel}
          secSandSoil={secSandSoil}
          setSecSandSoil={setSecSandSoil}
          secSoil={secSoil}
          setSecSoil={setSecSoil}
          secWetland={secWetland}
          setSecWetland={setSecWetland}
          secOther={secOther}
          setSecOther={setSecOther}
          packagedType={packagedType}
          setPackagedType={setPackagedType}
          packagedPE={packagedPE}
          setPackagedPE={setPackagedPE}
          primaryCompartment={primaryCompartment}
          setPrimaryCompartment={setPrimaryCompartment}
          tankModalVisible={tankModalVisible}
          setTankModalVisible={setTankModalVisible}
          TANK_TYPES={TANK_TYPES}
          pfSurfaceArea={pfSurfaceArea}
          setPfSurfaceArea={setPfSurfaceArea}
          optDirectArea={optDirectArea}
          setOptDirectArea={setOptDirectArea}
          optPumpedArea={optPumpedArea}
          setOptPumpedArea={setOptPumpedArea}
          optGravityLength={optGravityLength}
          setOptGravityLength={setOptGravityLength}
          optLowPressureLength={optLowPressureLength}
          setOptLowPressureLength={setOptLowPressureLength}
          optDripArea={optDripArea}
          setOptDripArea={setOptDripArea}
          tertiaryPurpose={tertiaryPurpose}
          setTertiaryPurpose={setTertiaryPurpose}
          tertiaryPerformance={tertiaryPerformance}
          setTertiaryPerformance={setTertiaryPerformance}
          tertiaryDesign={tertiaryDesign}
          setTertiaryDesign={setTertiaryDesign}
          dischargeChoice={dischargeChoice}
          setDischargeChoice={setDischargeChoice}
          hydraulicLoadingRate={hydraulicLoadingRate}
          setHydraulicLoadingRate={setHydraulicLoadingRate}
          surfaceAreaM2={surfaceAreaM2}
          setSurfaceAreaM2={setSurfaceAreaM2}
          dischargeRateM3hr={dischargeRateM3hr}
          setDischargeRateM3hr={setDischargeRateM3hr}
          filterAreaHint={filterAreaSuggestion.reason}
          trenchHint={polishTrenchSuggestion.reason}
          septicTrenchHint={septicTrenchSuggestion.reason}
          loadingRateHint={loadingRateSuggestion.reason}
        />
      )}

      {/* Show Quality Assurance Tab */}
      {currentTab === 'qualityAssurance' && (
        <QualityAssuranceTab
          qaInstall={qaInstall}
          setQaInstall={setQaInstall}
          qaMaintenance={qaMaintenance}
          setQaMaintenance={setQaMaintenance}
          qaInstallSuggestion={suggestedQaInstall}
          qaMaintenanceSuggestion={suggestedQaMaintenance}
        />
      )}

      {/* Show Site Assessor Tab */}
      {currentTab === 'siteAssessor' && (
        <SiteAssessorTab
          assCompany={assCompany}
          setAssCompany={setAssCompany}
          assPrefix={assPrefix}
          setAssPrefix={setAssPrefix}
          assFirst={assFirst}
          setAssFirst={setAssFirst}
          assSurname={assSurname}
          setAssSurname={setAssSurname}
          assAddress={assAddress}
          setAssAddress={setAssAddress}
          assQuals={assQuals}
          setAssQuals={setAssQuals}
          assDateOfReport={assDateOfReport}
          setAssDateOfReport={setAssDateOfReport}
          assPhone={assPhone}
          setAssPhone={setAssPhone}
          assEmail={assEmail}
          setAssEmail={setAssEmail}
          assIndemnity={assIndemnity}
          setAssIndemnity={setAssIndemnity}
          signatureUrl={signatureUrl}
          pickAndUploadSignature={pickAndUploadSignature}
          generateSignature={generateSignature}
          API_BASE={API_BASE}
          planPdfUrls={planPdfUrls}
          pickAndUploadPlans={pickAndUploadPlans}
          onDrivePlanPicked={onDrivePlanPicked}
          generateReport={generateReport}
        />
      )}
          </View>
  ) : null;
  const reportTitle = (firstName || surname) ? `${firstName} ${surname}`.trim() : (siteLocation || 'Untitled Report');

  // Wait for the initial (local, offline-safe) session check before deciding
  // whether to show the app or the login screen — see `sessionChecked` above.
  if (!sessionChecked) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </SafeAreaView>
    );
  }

  // Show auth screen only once we're sure there's no usable session —
  // never because of a network blip (see lib/supabase.ts / sessionChecked).
  if (!session) {
    return <Auth />;
  }

  // Website on a desktop-sized window: sidebar + top bar around the same pages.
  if (desktop) {
    const reportOpen = mainView === 'currentReport' && !!currentReportId;
    const sectionLabel = currentSection ? SectionMeta[currentSection]?.label || 'Section' : null;
    const generateBtn = (
      <TopBarButton title="Generate PDF" onPress={handleGenerate} busy={generating} icon={<IcoDownload size={17} />} />
    );
    return (
      <DesktopShell
        view={reportOpen ? 'currentReport' : mainView === 'currentReport' ? 'myReports' : mainView}
        onNavigate={async (v) => {
          await flushAutoSave();
          setMainView(v);
        }}
        user={{ name: session.user.user_metadata?.full_name || '', email: session.user.email || '' }}
        onSignOut={() => {
          Alert.alert('Sign out', 'Sign out of SiteReport on this computer?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => { supabase.auth.signOut(); } },
          ]);
        }}
        report={currentReportId ? {
          title: reportTitle,
          location: siteLocation,
          percent: (ALL_SECTIONS.filter((id) => sectionsComplete[id]).length / ALL_SECTIONS.length) * 100,
          sectionsComplete,
          section: currentSection,
          onOpen: async (id) => {
            await flushAutoSave();
            if (id) openSection(id); else setCurrentSection(null);
          },
        } : null}
        title={!reportOpen ? (mainView === 'settings' ? 'Settings' : 'Reports') : sectionLabel || reportTitle}
        subtitle={!reportOpen ? (mainView === 'settings' ? 'Your details and report defaults' : 'All your site assessments') : sectionLabel ? reportTitle : 'Report overview'}
        actions={reportOpen ? (
          <>
            {currentSection ? <SectionStepper section={currentSection} onOpen={async (id) => { await flushAutoSave(); openSection(id); }} /> : null}
            {generateBtn}
          </>
        ) : null}
      >
        {!reportOpen && mainView !== 'settings' && reportsBody}
        {!reportOpen && mainView === 'settings' && settingsBody}
        {reportOpen && currentSection === null && (
          <DesktopOverview
            siteName={reportTitle}
            location={siteLocation}
            clientName={fullName(prefix, firstName, surname)}
            fileRef={fileRef}
            status={currentReportStatus}
            sectionsComplete={sectionsComplete}
            onOpenSection={openSection}
          />
        )}
        {reportOpen && sectionBody}
      </DesktopShell>
    );
  }

return (
  <SafeAreaView style={styles.container}>
    {/* In normal layout flow, not floated over the header — it used to be
        absolutely positioned top-right, right on top of the Save button,
        and swallowed taps meant for it. */}
    <View style={styles.syncStatusRow}>
      <SyncStatusBar />
    </View>
    {/* My Reports view */}
    {mainView === 'myReports' && (
      <>
        <AppHeader
          title="My Reports"
          onMenu={() => setShowSidebar(true)}
          rightNode={
            <Pressable
              hitSlop={10}
              onPress={() => { handleNewReport(); setMainView('currentReport'); }}
              style={styles.headerPlus}
            >
              <IcoPlus size={20} color="#fff" />
            </Pressable>
          }
        />
        <View style={{ flex: 1 }}>
          {reportsBody}
        </View>
      </>
    )}

    {/* Settings view */}
    {mainView === 'settings' && (
      <>
        <AppHeader title="Settings" onBack={() => setMainView('myReports')} />
        <View style={{ flex: 1 }}>
          {settingsBody}
        </View>
      </>
    )}

    {/* Current Report — Overview hub */}
    {mainView === 'currentReport' && currentReportId && currentSection === null && (
      <>
        <AppHeader
          title={(firstName || surname) ? `${firstName} ${surname}`.trim() : 'Current Report'}
          onBack={() => setMainView('myReports')}
        />
        <ReportOverview
          siteName={(firstName || surname) ? `${firstName} ${surname}`.trim() : (siteLocation || 'Untitled Report')}
          location={siteLocation}
          clientName={fullName(prefix, firstName, surname)}
          fileRef={fileRef}
          status={currentReportStatus}
          sectionsComplete={sectionsComplete}
          onOpenSection={openSection}
          onGenerate={handleGenerate}
          generating={generating}
        />
      </>
    )}

    {/* Current Report — Section form */}
    {mainView === 'currentReport' && currentReportId && currentSection !== null && (
      <>
        <AppHeader
          title={SectionMeta[currentSection]?.label || 'Section'}
          onBack={saveAndCloseSection}
          rightLabel="Save"
          onRightPress={saveAndCloseSection}
        />

        {sectionBody}
      </>
    )}

    {/* Bottom tab bar */}
    <BottomTabBar
      active={mainView}
      hasCurrentReport={!!currentReportId}
      onChange={(v) => {
        if (v === 'currentReport') {
          setCurrentSection(null);
        }
        setMainView(v);
      }}
    />

    {/* Sidebar Navigation */}
    <Sidebar
      visible={showSidebar}
      onClose={() => setShowSidebar(false)}
      onNavigate={(screen) => {
        setMainView(screen);
        if (screen === 'currentReport') {
          setCurrentSection(null);
          setCurrentTab('maps');
        }
      }}
      currentReportId={currentReportId}
    />
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  syncStatusRow: {
    alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 4,
    backgroundColor: Brand.surface,
  },
  headerPlus: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabSwitcherWrapper: {
    backgroundColor: "#F0F0F0",
    margin: 16,
    marginBottom: 0,
    borderRadius: 10,
    overflow: "hidden",
  },
  tabSwitcher: {
    flexDirection: "row",
    padding: 6,
    gap: 6,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    minWidth: 80,
    height: 44,
  },
  activeTabButton: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
    lineHeight: 22,
  },
  activeTabButtonText: {
    color: "#4A90E2",
  },
  settingsButton: {
    backgroundColor: "#007AFF",
  },
  settingsButtonText: {
    color: "#FFF",
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  note: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  h1: { fontSize: 22, fontWeight: "600", marginBottom: 12 },
  row: { marginBottom: 10 },
  label: { marginBottom: 4, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  previewLabel: { marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: "500" },
  image: { width: "100%", height: 300, backgroundColor: "#f3f3f3", borderRadius: 8 },
  footer: { marginTop: 12, fontSize: 12, color: "#666" },
  scroll: {
  padding: 16,},
  section: {
  backgroundColor: "#a9d04f",  // soft green like the PDF
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginTop: 16,
  marginBottom: 8,
},
  sectionText: {
    color: "#1d1d1d",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.2,
},
  divider: {
  height: 1,
  backgroundColor: "#e3e3e3",
  marginVertical: 12,
},
  subtleNote: { fontSize: 12, color: "#666", marginBottom: 8 },
  
  actionBtn: {
  backgroundColor: "#efefef",
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
},
  actionBtnText: { fontWeight: "600" },
  formRow: {
  flexDirection: "row",
  gap: 12,
  alignItems: "flex-end", // <— aligns the bottoms so inputs line up
  marginTop: 8,
},
  col: { flex: 1 },

  modalBackdrop: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 12,
  width: "80%",
},
modalTitle: {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 12,
},
modalOption: {
  paddingVertical: 8,
},
modalOptionText: {
  fontSize: 16,
},

plansButton: {
  backgroundColor: "#007AFF",    // iOS-style blue button
  paddingVertical: 12,
  paddingHorizontal: 18,
  borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",
  marginTop: 10,
},

plansButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "600",
},









});


const drs = StyleSheet.create({
  segment: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cdd6cf",
    marginTop: 6,
    marginBottom: 10,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f2f5f2",
  },
  segBtnActive: {
    backgroundColor: "#d9ead3",
  },
  segText: {
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  segTextActive: {
    color: "#1a4d1a",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 10,
  },
  col: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  // visual cue only (kept editable)
  dim: {
    opacity: 0.9,
  },
});

// (optional) small layout helpers specific to this section
const sa = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  tall: { height: 120, textAlignVertical: "top" as const },
});


import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView, ScrollView, View, Text, TextInput, Button, Image, StyleSheet, Pressable, Dimensions } from "react-native";
import { Alert } from "react-native";
import { Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import { supabase } from "../../lib/supabase";
import { Session } from "@supabase/supabase-js";
import Auth from "./auth";
import { createReport, Report } from "../../lib/reports";
import { useAutoSave } from "../../hooks/useAutoSave";
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



const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionText}>{title}</Text>
  </View>
);


const API_BASE = "http://192.168.1.39:8080";


export default function Index() {
  type FlowPath = "Roots" | "Cracks" | "Wormholes" | "None";

  // Authentication state
  const [session, setSession] = useState<Session | null>(null);

  // Current report being worked on
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // Current active tab
  const [currentTab, setCurrentTab] = useState<'maps' | 'photos' | 'clientInfo' | 'deskStudy' | 'visualAssessment' | 'trialHole' | 'subsurfacePerc' | 'surfacePerc' | 'conclusion' | 'selectedDwwts' | 'treatmentSystems' | 'qualityAssurance' | 'siteAssessor' | 'myReports'>('myReports');

  // Sidebar and Settings
  const [showSidebar, setShowSidebar] = useState(false);
  const [assessorDefaults, setAssessorDefaults] = useState<AssessorDefaults | null>(null);
  const [mainView, setMainView] = useState<'currentReport' | 'myReports' | 'settings'>('myReports');

  // Ref for tab ScrollView to enable auto-scrolling
  const tabScrollViewRef = useRef<ScrollView>(null);
  const tabButtonRefs = useRef<{ [key: number]: View | null }>({});

  // Check for authentication session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadAssessorDefaults();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadAssessorDefaults();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't auto-create report - user will choose from My Reports tab

  const [imgUris, setImgUris] = useState<string[]>([]);
  const [mapDescriptions, setMapDescriptions] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [planPdfUrls, setPlanPdfUrls] = useState<string[]>([]);
  const [lat, setLat] = useState("54.393197");
  const [lon, setLon] = useState("-8.523567");
  const [buffer, setBuffer] = useState("4100");
  const [loading, setLoading] = useState(false);
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
  // Add near your other state declarations in index.tsx
  const [populationEquivalent, setPopulationEquivalent] = useState("");
  const [soilType, setSoilType] = useState("");
  const [subsoilType, setSubsoilType] = useState("");
  const [bedrockType, setBedrockType] = useState("");
  const [aquiferCategory, setAquiferCategory] = useState<"Regionally Important" | "Locally Important" | "Poor" | null>(null);
  const [aquiferCode, setAquiferCode] = useState<string>("");
  const [vulnerability, setVulnerability] = useState<"Extreme" | "High" | "Moderate" | "Low" | null>(null);
  const [gwBody, setGwBody] = useState("");
  const [gwStatus, setGwStatus] = useState<"Good" | "Poor" | null>(null);
  const [nearbySupply, setNearbySupply] = useState("");  // e.g. "None" or scheme name
  const [spaZOC, setSpaZOC] = useState(false);
  const [spaSI, setSpaSI] = useState(false);
  const [spaSO, setSpaSO] = useState(false);
  const [gwProtectionResponse, setGwProtectionResponse] = useState(""); // e.g. "R1"
  const [significantSites, setSignificantSites] = useState("");
  const [pastExperience, setPastExperience] = useState("");
  const [deskComments, setDeskComments] = useState("");
  const [landscapePosition, setLandscapePosition] = useState("");
  const [slope, setSlope] = useState<string>("");
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
  const [horizonErrors, setHorizonErrors] = useState<string[]>([]);
  const [trialHoleValid, setTrialHoleValid] = useState(false);
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
  const [dwwtsDischargeTo, setDwwtsDischargeTo] = useState("");
  const [invertLevel, setInvertLevel] = useState("");           // metres
  const [siteSpecificConditions, setSiteSpecificConditions] = useState("");


  // 6.0 — Septic Tank Systems (Chapter 7)
  const [septTankCapacity, setSeptTankCapacity] = useState(""); // m³

const API_BASE = "http://192.168.1.39:8080";

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

  const [qaInstall, setQaInstall] = useState(
    "The wastewater treatment system must be installed in accordance with the manufacturer's instructions. The soil polishing filter must be installed in accordance with the plans attached below."
  );
  const [qaMaintenance, setQaMaintenance] = useState(
    "The homeowner must enter into a maintenance contract with the system manufacturer. The system must be inspected and maintained on an annual basis."
  );

  // 7.0 — SITE ASSESSOR DETAILS
  const [assCompany, setAssCompany] = useState("");
  const [assPrefix, setAssPrefix] = useState("");
  const [assFirst, setAssFirst] = useState("");
  const [assSurname, setAssSurname] = useState("");
  const [assAddress, setAssAddress] = useState("");
  const [assQuals, setAssQuals] = useState("");
  const [assDateOfReport, setAssDateOfReport] = useState(""); // YYYY-MM-DD
  useEffect(() => {
    // Autofill on first load only (won’t override if user already typed something)
    setAssDateOfReport((prev) => prev?.trim() ? prev : new Date().toISOString().slice(0, 10));
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

  async function prefillFromLayerSummaries(currentLat: string, currentLon: string) {
    try {
      const url = `${API_BASE}/layer_summaries?lat=${encodeURIComponent(
        currentLat
      )}&lon=${encodeURIComponent(currentLon)}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.warn("layer_summaries failed with status", res.status);
        return;
      }

      const json = await res.json();
      const summaries = (json && (json as any).summaries) || {};

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

      // --- Aquifer Category (map description -> enum) ---
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
      }

      // --- Vulnerability (map description -> enum) ---
      const vul = summaries.vulnerability;
      if (vul && typeof vul.description === "string") {
        const desc = String(vul.description);
        const lower = desc.toLowerCase();

        let vulCat: "Extreme" | "High" | "Moderate" | "Low" | null = null;
        if (lower.includes("extreme")) {
          vulCat = "Extreme";
        } else if (lower.includes("high")) {
          vulCat = "High";
        } else if (lower.includes("moderate")) {
          vulCat = "Moderate";
        } else if (lower.includes("low")) {
          vulCat = "Low";
        }

        if (vulCat && !vulnerability) {
          setVulnerability(vulCat as any);
        }
      }

      // --- Groundwater Body ---
      const gwb = summaries.groundwater_body;
      if (gwb && typeof gwb.description === "string" && !gwBody) {
        setGwBody(gwb.description);
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

      // --- Groundwater Flow Direction ---
      const flow = summaries.groundwater_flow;
      if (flow && typeof flow.direction_text === "string" && !gwFlowDirection) {
        setGwFlowDirection(flow.direction_text);
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
          reportDate: new Date().toISOString().slice(0, 10),
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
  const pickSurfacePV = () => {
    if (surfAvgT100 == null) return null;
    if (surfAvgT100 > 300) return 91;            // >90 ⇒ unsuitable
    if (surfAvgT100 <= 210) return surfStdResult ?? null;
    return surfModResult ?? null;
  };

  const pickSubsurfacePV = () => {
    // If you have a subsurface T100 average var, use the same branching.
    // Fallback: whichever result you actually filled.
    if (stdResult != null) return stdResult;
    if (modResult != null) return modResult;
    return null;
  };

  // --- 4.0 state you already had ---
  /* keep your existing:
    sepDistancesMet, unsatDepth, suitableForDevelopment,
    optSepticTank, optSecondary, optTertiary, dischargeRoute
    and REUSE your earlier `slope` (do not create a new slope state)
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

    // --- Auto-prefill dates within each test section ---

  type PercDateField = "preSoak1Date" | "preSoak2Date" | "testDate";

  const updatePercDateField = (index: number, field: PercDateField, value: string) => {
    setPercHoles((prev) => {
      if (prev.length === 0) return prev;
      const oldFirst = prev[0][field] || "";
      const next = prev.map((h) => ({ ...h }));
      next[index][field] = value;

      // If we changed hole 1, propagate to other subsurface holes
      if (index === 0) {
        for (let i = 1; i < next.length; i++) {
          const prevVal = prev[i][field];
          if (prevVal === "" || prevVal === oldFirst) {
            next[i][field] = value;
          }
        }
      }
      return next;
    });
  };

  type SurfDateField = "preSoak1Date" | "preSoak2Date" | "testDate";

  const updateSurfDateField = (index: number, field: SurfDateField, value: string) => {
    setSurfHoles((prev) => {
      if (prev.length === 0) return prev;
      const oldFirst = prev[0][field] || "";
      const next = prev.map((h) => ({ ...h }));
      next[index][field] = value;

      // If we changed hole 1, propagate to other surface holes
      if (index === 0) {
        for (let i = 1; i < next.length; i++) {
          const prevVal = prev[i][field];
          if (prevVal === "" || prevVal === oldFirst) {
            next[i][field] = value;
          }
        }
      }
      return next;
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



  type Horizon = {
    id: string;
    from: string;
    to: string;
    texture?: string;        // free text
    plasticity?: string;     // free text
    dilatancy?: string;      // free text
    structure?: string;      // free text
    compactness?: string;    // free text
    colour?: string;         // free text
    flowpaths?: string;      // free text (e.g., "roots, cracks")
    notes?: string;          // free text
  };


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



  const [horizons, setHorizons] = useState<Horizon[]>([
    { id: Math.random().toString(36).slice(2), from: "0.0", to: "" },
  ]);

  const [editingHorizonId, setEditingHorizonId] = useState<string | null>(null);



  const addHorizon = () => {
    const last = horizons[horizons.length - 1];
    const start = last?.to || (trialDepth || "0.0");
    setHorizons((h) => [...h, { id: Math.random().toString(36).slice(2), from: start, to: "" }]);
  };

  const copyLastHorizon = () => {
    const last = horizons[horizons.length - 1];
    if (!last) return addHorizon();
    setHorizons((h) => [
      ...h,
      { id: Math.random().toString(36).slice(2), from: last.to || last.from, to: last.to },
    ]);
  };

  const updateHorizon = (id: string, field: "from" | "to", value: string) => {
    setHorizons((h) => h.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeHorizon = (id: string) => {
    setHorizons((h) => h.filter((row) => row.id !== id));
  };

  const getHorizonErrors = (): string[] => {
    const errs: string[] = [];
    const EPS = 0.01;

    const parsed = horizons.map((h, i) => ({
      i,
      from: parseFloat(h.from),
      to: parseFloat(h.to),
      raw: h,
    }));

    parsed.forEach(({ i, from, to }) => {
      if (Number.isNaN(from)) errs.push(`Horizon ${i + 1}: “From” is not a number.`);
      if (Number.isNaN(to)) errs.push(`Horizon ${i + 1}: “To” is not a number.`);
      if (!Number.isNaN(from) && !Number.isNaN(to) && !(from < to)) {
        errs.push(`Horizon ${i + 1}: “From” must be less than “To”.`);
      }
    });
    if (errs.length) return errs;

    const sorted = [...parsed].sort((a, b) => a.from - b.from);
    if (sorted.length && Math.abs(sorted[0].from - 0) > EPS) {
      errs.push(`First horizon must start at 0.0 m.`);
    }
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], cur = sorted[i];
      if (cur.from > prev.to + EPS) errs.push(`Gap between horizons ${prev.i + 1} and ${cur.i + 1}.`);
      if (cur.from < prev.to - EPS) errs.push(`Overlap between horizons ${prev.i + 1} and ${cur.i + 1}.`);
    }

    const td = parseFloat(trialDepth);
    if (!Number.isNaN(td) && sorted.length) {
      const lastTo = sorted[sorted.length - 1].to;
      if (Math.abs(lastTo - td) > EPS) {
        errs.push(`Last horizon ends at ${lastTo} m but trial depth is ${td} m.`);
      }
    }
    return errs;
  };

    useEffect(() => {
      const errs = getHorizonErrors();
      setHorizonErrors(errs);
      setTrialHoleValid(errs.length === 0);
    }, [horizons, trialDepth]);

    // Parse "HH:mm" to minutes from midnight; returns NaN if invalid
    const hhmmToMin = (t: string): number => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
      if (!m) return NaN;
      const h = parseInt(m[1], 10), min = parseInt(m[2], 10);
      return h * 60 + min;
    };

    // Recalculate deltas, averages, t_s, and overall result
    const recomputeStandard = (holes: StandardHole[]) => {
      const updated = holes.map(h => {
        const fills = h.fills.map(f => {
          const s = hhmmToMin(f.start);
          const e = hhmmToMin(f.finish);
          const delta = !Number.isNaN(s) && !Number.isNaN(e) && e >= s ? Number(((e - s)).toFixed(2)) : undefined;
          return { ...f, deltaMin: delta };
        }) as [StandardFill, StandardFill, StandardFill];

        const deltas = fills.map(f => f.deltaMin).filter((d): d is number => typeof d === "number");
        const avgDelta = deltas.length === 3 ? Number((deltas.reduce((a, b) => a + b, 0) / 3).toFixed(2)) : undefined;
        const ts = typeof avgDelta === "number" ? Number((avgDelta / 4).toFixed(2)) : undefined;

        return { ...h, fills, avgDelta, ts };
      });

      const tsValues = updated.map(h => h.ts).filter((v): v is number => typeof v === "number");
      const overall = tsValues.length > 0 ? Number((tsValues.reduce((a, b) => a + b, 0) / tsValues.length).toFixed(2)) : null;

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



    // Recalculate t_n, k_t, t_val, holeT, and overall result
    const recomputeModified = (holes: ModifiedHole[]) => {
      const updated = holes.map(h => {
        const bands = h.bands.map((b, i) => {
          const s = hhmmToMin(b.start);
          const e = hhmmToMin(b.finish);
          const tn = !Number.isNaN(s) && !Number.isNaN(e) && e >= s ? Number(((e - s)).toFixed(2)) : undefined;
          const kt = typeof tn === "number" ? Number((tn / TF_FACTORS[i]).toFixed(2)) : undefined;
          const tVal = typeof kt === "number" && kt > 0 ? Number((4.45 / kt).toFixed(2)) : undefined;
          return { ...b, tn, kt, tVal };
        }) as [ModifiedBand, ModifiedBand, ModifiedBand, ModifiedBand];

        const tVals = bands.map(b => b.tVal).filter((v): v is number => typeof v === "number");
        const holeT = tVals.length === 4 ? Number((tVals.reduce((a, b) => a + b, 0) / 4).toFixed(2)) : undefined;

        return { ...h, bands, holeT };
      });

      const holeTs = updated.map(h => h.holeT).filter((v): v is number => typeof v === "number");
      const overall = holeTs.length > 0 ? Number((holeTs.reduce((a, b) => a + b, 0) / holeTs.length).toFixed(2)) : null;

      setModHoles(updated);
      setModResult(overall);
    };

    const setModField = (holeIdx: number, bandIdx: number, key: "start" | "finish", val: string) => {
      const copy = JSON.parse(JSON.stringify(modHoles)) as ModifiedHole[];
      (copy[holeIdx].bands[bandIdx] as any)[key] = val;
      recomputeModified(copy);
    };

    const recomputeSurfaceT100 = (holes: SurfHole[]) => {
      const upd = holes.map(h => {
        const s = hhmmToMin(h.fillTime);
        const e = hhmmToMin(h.waterLevelTime);
        const t100 = !Number.isNaN(s) && !Number.isNaN(e) && e >= s ? (e - s) : undefined;
        return { ...h, t100 };
      });

      const vals = upd.map(h => h.t100).filter((v): v is number => typeof v === "number");
      const avg = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : null;

      setSurfHoles(upd);
      setSurfAvgT100(avg);
    };

    // convenience setter
    const setSurfField = (hi: number, key: keyof SurfHole, val: string) => {
      const copy = JSON.parse(JSON.stringify(surfHoles)) as SurfHole[];
      (copy[hi] as any)[key] = val;
      // auto-calc hole depth if both top/base present
      if ((key === "topDepth" || key === "baseDepth")) {
        const top = parseFloat(copy[hi].topDepth);
        const base = parseFloat(copy[hi].baseDepth);
        if (!Number.isNaN(top) && !Number.isNaN(base) && base >= top) {
          copy[hi].holeDepth = (base - top).toString();
        }
      }
      // recompute T100 after time edits
      if (key === "fillTime" || key === "waterLevelTime") {
        recomputeSurfaceT100(copy);
      } else {
        setSurfHoles(copy);
      }
    };


    const recomputeSurfStandard = (holes: SurfStdHole[]) => {
      const upd = holes.map(h => {
        const fills = h.fills.map(f => {
          const s = hhmmToMin(f.start);
          const e = hhmmToMin(f.finish);
          const d = !Number.isNaN(s) && !Number.isNaN(e) && e >= s ? Number(((e - s)).toFixed(2)) : undefined;
          return { ...f, deltaMin: d };
        }) as [SurfStdFill, SurfStdFill, SurfStdFill];

        const deltas = fills.map(f => f.deltaMin).filter((x): x is number => typeof x === "number");
        const avgDelta = deltas.length === 3 ? Number((deltas.reduce((a,b)=>a+b,0) / 3).toFixed(2)) : undefined;
        const ts = typeof avgDelta === "number" ? Number((avgDelta / 4).toFixed(2)) : undefined;

        return { ...h, fills, avgDelta, ts };
      });

      const tsVals = upd.map(h => h.ts).filter((x): x is number => typeof x === "number");
      const overall = tsVals.length ? Number((tsVals.reduce((a,b)=>a+b,0) / tsVals.length).toFixed(2)) : null;

      setSurfStdHoles(upd);
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
    const updated = holes.map(h => {
      const bands = h.bands.map((b, i) => {
        const s = hhmmToMin(b.start);
        const e = hhmmToMin(b.finish);
        const tn  = !Number.isNaN(s) && !Number.isNaN(e) && e >= s ? Number(((e - s)).toFixed(2)) : undefined;
        const kt  = typeof tn === "number" ? Number((tn / SURF_TF_FACTORS[i]).toFixed(2)) : undefined;
        const tVal = typeof kt === "number" && kt > 0 ? Number((4.45 / kt).toFixed(2)) : undefined;
        return { ...b, tn, kt, tVal };
      }) as [SurfModBand, SurfModBand, SurfModBand, SurfModBand];

      const tVals = bands.map(b => b.tVal).filter((v): v is number => typeof v === "number");
      const holeT = tVals.length === 4 ? Number((tVals.reduce((a, b) => a + b, 0) / 4).toFixed(2)) : undefined;

      return { ...h, bands, holeT };
    });

    const holeTs = updated.map(h => h.holeT).filter((v): v is number => typeof v === "number");
    const overall = holeTs.length ? Number((holeTs.reduce((a, b) => a + b, 0) / holeTs.length).toFixed(2)) : null;

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

    // 2.3 Unsaturated depth: if horizons show requirement (e.g. 0.90 m for R1), set a sensible default
    if (!cDirty.unsatDepth && !unsatDepth) {
      setUnsatDepth("0.90"); // editable; change if your site requires different
    }

    // 2.4 Suitable for development: simple rule of thumb
    if (!cDirty.suitable) {
      const okSurface = sPV != null && sPV <= 90;
      const okSub = ssPV != null && ssPV <= 90;
      const okUnsat = parseFloat(unsatDepth || "0") >= 0.9;
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
    stdResult, modResult,
    unsatDepth, sepDistancesMet, dischargeRoute,
    cDirty,
  ]);

  const sPV = pickSurfacePV();
  const ssPV = pickSubsurfacePV();


  function expandHorizonsToDepthRows(src: Horizon[]) {
  // Build quick lookup: for any depth d, which horizon covers it?
  // We treat each horizon as covering [from, to) in metres.
  const parsed = src
    .map(h => ({
      ...h,
      fromNum: parseFloat(h.from),
      toNum: parseFloat(h.to),
    }))
    .filter(
      h =>
        !Number.isNaN(h.fromNum) &&
        !Number.isNaN(h.toNum) &&
        h.fromNum < h.toNum
    )
    .sort((a, b) => a.fromNum - b.fromNum);

  const rows: {
    depth: string;
    classification?: string;
    dilatancy?: string;
    structure?: string;
    compactness?: string;
    colour?: string;
    flowpaths?: string;
  }[] = [];

  // 0.1 m → 3.5 m inclusive (35 rows in the PDF)
  for (let i = 1; i <= 35; i++) {
    const d = +(i / 10).toFixed(1); // 0.1, 0.2, ..., 3.5

    // horizon that covers this depth: [from, to)
    // e.g. horizon 0.0–0.3 → used for 0.0≤depth<0.3 (rows 0.1 & 0.2)
    const h = parsed.find(hz => d >= hz.fromNum && d < hz.toNum);

    if (!h) continue;

    rows.push({
      depth: d.toFixed(1), // backend accepts "0.1"
      classification: (h.texture || "").trim(),
      dilatancy: ((h as any).plasticity ?? h.dilatancy ?? "")
        .toString()
        .trim(),
      structure: (h.structure || "").trim(),
      compactness: (h.compactness || "").trim(),
      colour: (h.colour || "").trim(),
      flowpaths: (h.flowpaths || "").trim(),
    });
  }

  return rows;
}








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
      formData.append(
        "file",
        {
          uri: asset.uri,
          name: fileName,
          type: "image/jpeg",
        } as any
      );

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

  async function pickAndUploadSignature() {
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
      formData.append(
        "file",
        {
          uri: asset.uri,
          name: fileName,
          type: "image/png",
        } as any
      );

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
        formData.append(
          "file",
          {
            uri: asset.uri,
            name: fileName,
            type: "application/pdf",
          } as any
        );

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




  async function generateReport() {
    try {
      // minimal guardrails
      if (!fileRef?.trim()) {
        Alert.alert("Missing File Ref", "Please enter a File Ref first.");
        return;
      }


      const res = await fetch(`${API_BASE}/generate_report_from_app`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // PAGE 1
          lat: Number((lat || "").toString().trim()),
          lon: Number((lon || "").toString().trim()),
          fileRef: (fileRef || "").trim(),
          prefix: (prefix || "").trim(),
          firstName: (firstName || "").trim(),
          surname: (surname || "").trim(),
          address: (address || "").trim(),
          siteLocation: (siteLocation || "").trim(),
          populationEquivalent: (populationEquivalent || "").trim(),
          bedrooms: (bedrooms ?? "").toString().trim(),
          residents: (residents ?? "").toString().trim(),
          waterSupply: (waterSupply || "").toLowerCase().trim(), // "mains" | "private" | "group"
          privateWellDetail: privateWellDetail || "",
          reportDate: new Date().toISOString().slice(0, 10),

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
          th_excavationDate: (excavDate || "").trim(),     // "YYYY-MM-DD"
          th_excavationTime: (excavTime || "").trim(),     // "HH:mm"
          th_examinationDate: (examDate || "").trim(),     // "YYYY-MM-DD"
          th_examinationTime: (examTime || "").trim(),     // "HH:mm"
          // --- 3.2 Trial Hole — Soil Columns (manual full-column text) ---
          th_classificationColumn: (thClassificationCol || "").trim(),
          th_dilatancyColumn:      (thDilatancyCol || "").trim(),
          th_structureColumn:      (thStructureCol || "").trim(),
          th_compactnessColumn:    (thCompactnessCol || "").trim(),
          th_colourColumn:         (thColourCol || "").trim(),
          th_flowpathsColumn:      (thFlowpathsCol || "").trim(),


          // --- 3.2 Horizons grid (0.1 m rows) ---
          //horizons: expandHorizonsToDepthRows(horizons),

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
          slopeProposed: (slope || "").trim(),     // e.g. "Relatively flat" / "Shallow" / "Steep"
          minDistances:  sepDistancesMet ? "✔" : "",         // show a tick if true, blank if false


          // --- Conclusion (Page 4) ---
          conclusion: {
            // dropdown/text — uses your existing `slope` state
            slope: (slope || "").trim(),

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
            prefix: (assPrefix || "").trim(),
            first_name: (assFirst || "").trim(),
            surname: (assSurname || "").trim(),
            address: (assAddress || "").trim(),
            qualifications: (assQuals || "").trim(),
            date_of_report: (assDateOfReport || new Date().toISOString().slice(0,10)),
            phone: (assPhone || "").trim(),
            email: (assEmail || "").trim(),
            indemnity_insurance_number: (assIndemnity || "").trim(),
            signature_url: signatureUrl || "",
          },



          maps: (imgUris || []).slice(0, 10),
          photos: photoUrls,
          plans: planPdfUrls,










          


          

        }),

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

        Alert.alert("Report created (Page 1)", message);
        Linking.openURL(pdfUrl);
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
      setPopulationEquivalent(clientInfo.populationEquivalent || '');

      const deskStudy = report.desk_study || {};
      setSoilType(deskStudy.soilType || '');
      setSubsoilType(deskStudy.subsoilType || '');
      setBedrockType(deskStudy.bedrockType || '');
      setAquiferCategory(deskStudy.aquiferCategory || null);
      setAquiferCode(deskStudy.aquiferCode || '');
      setVulnerability(deskStudy.vulnerability || null);
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
      setDwwtsDischargeTo(selectedDwwts.dwwtsDischargeTo || '');
      setInvertLevel(selectedDwwts.invertLevel || '');
      setSiteSpecificConditions(selectedDwwts.siteSpecificConditions || '');

      const conclusion = report.conclusion || {};
      setSlope(conclusion.slope || '');
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

      // Set the current report ID
      setCurrentReportId(report.id);

      // Switch to maps tab
      setCurrentTab('maps');

      Alert.alert('Report Loaded', `Loaded: ${report.site_name}`);
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
      }
    } catch (err) {
      console.error('Failed to load assessor defaults:', err);
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
        setPopulationEquivalent('');
        setSoilType('');
        setSubsoilType('');
        setBedrockType('');
        setAquiferCategory(null);
        setAquiferCode('');
        setVulnerability(null);
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
        setLandscapePosition('');
        setSlope('');
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
        setHorizons([{ id: Math.random().toString(36).slice(2), from: "0.0", to: "" }]);
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
        setQaInstall("I have read the relevant sections of the EPA CoP and the specification is in accordance with the manual.");
        setQaMaintenance("I have read the relevant sections of the EPA CoP and maintenance requirements have been set out in accordance with the manual.");

        // Reset Site Assessor data (except defaults which will be applied below)
        setSignatureUrl(null);
        setPlanPdfUrls([]);
        setAssDateOfReport(new Date().toISOString().split('T')[0]);

        // Apply assessor defaults if available
        if (assessorDefaults) {
          applyAssessorDefaults(assessorDefaults);
        }

        setCurrentReportId(data.id);
        setCurrentTab('maps');

        Alert.alert('New Report Created', 'Start filling in your assessment');
      }
    } catch (error) {
      console.error('Failed to create report:', error);
      Alert.alert('Error', 'Failed to create new report');
    }
  }

  // Generate maps function
  async function generateMaps() {
    setImgErr(null);
    setLoading(true);
    try {
      // Get current user ID for organizing uploaded maps
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // 1) Generate the map images
      const mapsUrl = `${API_BASE}/generate_maps?lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&buffer_m=${encodeURIComponent(buffer)}&user_id=${encodeURIComponent(userId)}`;

      const res = await fetch(mapsUrl);
      const json = await res.json();

      const cacheBust = Date.now();
      const uris = (json?.maps ?? []).map(
        (p: string) => `${p}?_t=${cacheBust}`
      );
      setImgUris(uris); // store all image URLs

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

      // 2) Prefill desk-study fields from live GSI summaries
      await prefillFromLayerSummaries(lat, lon);
    } catch (e: any) {
      setImgErr(String(e?.message ?? e));
      setImgUris([]);
      setMapDescriptions({});
    } finally {
      setLoading(false);
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

  // Auto-save all form data to Supabase
  useAutoSave(
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
        populationEquivalent,
      },
      deskStudy: {
        soilType,
        subsoilType,
        bedrockType,
        aquiferCategory,
        aquiferCode,
        vulnerability,
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
      },
      conclusion: {
        slope,
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

  // Show auth screen if not logged in
  if (!session) {
    return <Auth />;
  }

// inside your component's return:
return (
  <SafeAreaView style={styles.container}>
    {/* Top Navigation Bar */}
    <View style={styles.topBar}>
      <Pressable style={styles.menuButton} onPress={() => setShowSidebar(true)}>
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>
      <Text style={styles.topBarTitle}>
        {mainView === 'currentReport' && currentReportId ? 'Current Report' :
         mainView === 'settings' ? 'Settings' : 'My Reports'}
      </Text>
      <View style={styles.menuButton} />
    </View>

    {/* Conditionally render based on mainView */}
    {mainView === 'currentReport' && currentReportId && (
      <>
        {/* Tab Switcher */}
        <View style={styles.tabSwitcherWrapper}>
      <ScrollView
        ref={tabScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabSwitcher}
      >
        <Pressable
          ref={(ref) => { tabButtonRefs.current[0] = ref; }}
          style={[styles.tabButton, currentTab === 'maps' && styles.activeTabButton]}
          onPress={() => handleTabChange('maps', 0)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'maps' && styles.activeTabButtonText]}>
            Maps
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[1] = ref; }}
          style={[styles.tabButton, currentTab === 'photos' && styles.activeTabButton]}
          onPress={() => handleTabChange('photos', 1)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'photos' && styles.activeTabButtonText]}>
            Photos
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[2] = ref; }}
          style={[styles.tabButton, currentTab === 'clientInfo' && styles.activeTabButton]}
          onPress={() => handleTabChange('clientInfo', 2)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'clientInfo' && styles.activeTabButtonText]}>
            Client Info
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[3] = ref; }}
          style={[styles.tabButton, currentTab === 'deskStudy' && styles.activeTabButton]}
          onPress={() => handleTabChange('deskStudy', 3)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'deskStudy' && styles.activeTabButtonText]}>
            Desk Study
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[4] = ref; }}
          style={[styles.tabButton, currentTab === 'visualAssessment' && styles.activeTabButton]}
          onPress={() => handleTabChange('visualAssessment', 4)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'visualAssessment' && styles.activeTabButtonText]}>
            Visual Assessment
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[5] = ref; }}
          style={[styles.tabButton, currentTab === 'trialHole' && styles.activeTabButton]}
          onPress={() => handleTabChange('trialHole', 5)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'trialHole' && styles.activeTabButtonText]}>
            Trial Hole
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[6] = ref; }}
          style={[styles.tabButton, currentTab === 'subsurfacePerc' && styles.activeTabButton]}
          onPress={() => handleTabChange('subsurfacePerc', 6)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'subsurfacePerc' && styles.activeTabButtonText]}>
            Subsurface Perc
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[7] = ref; }}
          style={[styles.tabButton, currentTab === 'surfacePerc' && styles.activeTabButton]}
          onPress={() => handleTabChange('surfacePerc', 7)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'surfacePerc' && styles.activeTabButtonText]}>
            Surface Perc
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[8] = ref; }}
          style={[styles.tabButton, currentTab === 'conclusion' && styles.activeTabButton]}
          onPress={() => handleTabChange('conclusion', 8)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'conclusion' && styles.activeTabButtonText]}>
            Conclusion
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[9] = ref; }}
          style={[styles.tabButton, currentTab === 'selectedDwwts' && styles.activeTabButton]}
          onPress={() => handleTabChange('selectedDwwts', 9)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'selectedDwwts' && styles.activeTabButtonText]}>
            Selected DWWTS
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[10] = ref; }}
          style={[styles.tabButton, currentTab === 'treatmentSystems' && styles.activeTabButton]}
          onPress={() => handleTabChange('treatmentSystems', 10)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'treatmentSystems' && styles.activeTabButtonText]}>
            Treatment Systems
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[11] = ref; }}
          style={[styles.tabButton, currentTab === 'qualityAssurance' && styles.activeTabButton]}
          onPress={() => handleTabChange('qualityAssurance', 11)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'qualityAssurance' && styles.activeTabButtonText]}>
            Quality Assurance
          </Text>
        </Pressable>
        <Pressable
          ref={(ref) => { tabButtonRefs.current[12] = ref; }}
          style={[styles.tabButton, currentTab === 'siteAssessor' && styles.activeTabButton]}
          onPress={() => handleTabChange('siteAssessor', 12)}
        >
          <Text style={[styles.tabButtonText, currentTab === 'siteAssessor' && styles.activeTabButtonText]}>
            Site Assessor
          </Text>
        </Pressable>
      </ScrollView>
    </View>

    {/* Show Maps Tab */}
    {currentTab === 'maps' && (
      <MapsTab
        lat={lat}
        setLat={setLat}
        lon={lon}
        setLon={setLon}
        buffer={buffer}
        setBuffer={setBuffer}
        loading={loading}
        imgErr={imgErr}
        imgUris={imgUris}
        mapDescriptions={mapDescriptions}
        generateMaps={generateMaps}
        getCurrentLocation={getCurrentLocation}
      />
    )}

    {/* Show Photos Tab */}
    {currentTab === 'photos' && (
      <PhotosTab
        photoUrls={photoUrls}
        setPhotoUrls={setPhotoUrls}
      />
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
        significantSites={significantSites}
        setSignificantSites={setSignificantSites}
        pastExperience={pastExperience}
        setPastExperience={setPastExperience}
        deskComments={deskComments}
        setDeskComments={setDeskComments}
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
        setThFlowpathsCol={setThFlowpathsCol}
        likelySubsurfaceP={likelySubsurfaceP}
        setLikelySubsurfaceP={setLikelySubsurfaceP}
        likelySurfaceP={likelySurfaceP}
        setLikelySurfaceP={setLikelySurfaceP}
        trialHoleEvaluation={trialHoleEvaluation}
        setTrialHoleEvaluation={setTrialHoleEvaluation}
      />
    )}

    {/* Show Subsurface Percolation Tab */}
    {currentTab === 'subsurfacePerc' && (
      <SubsurfacePercTab
        percHoles={percHoles}
        setPercHoles={setPercHoles}
        updatePercDateField={updatePercDateField}
        stdHoles={stdHoles}
        setStdHoles={setStdHoles}
        setStdField={setStdField}
        stdResult={stdResult}
        step4Comments={step4Comments}
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
        updateSurfDateField={updateSurfDateField}
        surfStdHoles={surfStdHoles}
        setSurfStdField={setSurfStdField}
        surfStdResult={surfStdResult}
        surfStdComments={surfStdComments}
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
        slope={slope}
        setSlope={setSlope}
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
      />
    )}

    {/* Show Quality Assurance Tab */}
    {currentTab === 'qualityAssurance' && (
      <QualityAssuranceTab
        qaInstall={qaInstall}
        setQaInstall={setQaInstall}
        qaMaintenance={qaMaintenance}
        setQaMaintenance={setQaMaintenance}
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
        API_BASE={API_BASE}
        planPdfUrls={planPdfUrls}
        pickAndUploadPlans={pickAndUploadPlans}
        generateReport={generateReport}
      />
    )}

      </>
    )}

    {/* My Reports View */}
    {mainView === 'myReports' && (
      <MyReportsTab
        onLoadReport={(id) => {
          loadReport(id);
          setMainView('currentReport');
        }}
        onNewReport={() => {
          handleNewReport();
          setMainView('currentReport');
        }}
        currentReportId={currentReportId}
      />
    )}

    {/* Settings View */}
    {mainView === 'settings' && (
      <SettingsTab
        onClose={() => setMainView('myReports')}
        onSave={(defaults) => {
          setAssessorDefaults(defaults);
        }}
      />
    )}

    {/* Sidebar Navigation */}
    <Sidebar
      visible={showSidebar}
      onClose={() => setShowSidebar(false)}
      onNavigate={(screen) => {
        setMainView(screen);
        if (screen === 'currentReport') {
          setCurrentTab('maps');
        }
      }}
      currentReportId={currentReportId}
    />
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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


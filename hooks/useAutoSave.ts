import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface ReportData {
  clientInfo?: any;
  deskStudy?: any;
  visualAssessment?: any;
  trialHole?: any;
  subsurfacePerc?: any;
  surfacePerc?: any;
  conclusion?: any;
  selectedDwwts?: any;
  treatmentSystems?: any;
  qualityAssurance?: any;
  siteAssessor?: any;
  photoUrls?: string[];
  mapUrls?: string[];
}

export function useAutoSave(
  reportId: string | null,
  data: ReportData,
  enabled: boolean = true
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !reportId) return;

    const currentData = JSON.stringify(data);

    // Only save if data has actually changed
    if (currentData === previousDataRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce auto-save by 2 seconds
    timeoutRef.current = setTimeout(async () => {
      try {
        // Extract site name from siteLocation (townland)
        const siteName = data.clientInfo?.siteLocation?.trim() || 'Untitled Report';

        const { error } = await supabase
          .from('reports')
          .update({
            site_name: siteName,
            client_info: data.clientInfo || {},
            desk_study: data.deskStudy || {},
            visual_assessment: data.visualAssessment || {},
            trial_hole: data.trialHole || {},
            subsurface_perc: data.subsurfacePerc || {},
            surface_perc: data.surfacePerc || {},
            conclusion: data.conclusion || {},
            selected_dwwts: data.selectedDwwts || {},
            treatment_systems: data.treatmentSystems || {},
            quality_assurance: data.qualityAssurance || {},
            site_assessor: data.siteAssessor || {},
            photo_urls: data.photoUrls || [],
            map_urls: data.mapUrls || [],
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        if (error) {
          console.error('Auto-save error:', error);
        } else {
          previousDataRef.current = currentData;
          console.log('Auto-saved at', new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, reportId, enabled]);
}

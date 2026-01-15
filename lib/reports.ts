import { supabase } from './supabase';

export interface Report {
  id: string;
  user_id: string;
  status: 'draft' | 'completed';
  site_name: string | null;
  client_info: any;
  desk_study: any;
  visual_assessment: any;
  trial_hole: any;
  subsurface_perc: any;
  surface_perc: any;
  conclusion: any;
  selected_dwwts: any;
  treatment_systems: any;
  quality_assurance: any;
  site_assessor: any;
  photo_urls: string[];
  map_urls: string[];
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Ensure user profile exists
 */
async function ensureProfile(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  // If profile doesn't exist, create it
  if (!profile) {
    await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Unknown',
        },
      ]);
  }
}

/**
 * Create a new draft report
 */
export async function createReport(siteName?: string): Promise<{ data: Report | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } };
  }

  // Ensure profile exists before creating report
  await ensureProfile();

  const { data, error } = await supabase
    .from('reports')
    .insert([
      {
        user_id: user.id,
        site_name: siteName || 'Untitled Report',
        status: 'draft',
      },
    ])
    .select()
    .single();

  return { data, error };
}

/**
 * Get all reports for the current user
 */
export async function getUserReports(): Promise<{ data: Report[] | null; error: any }> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('updated_at', { ascending: false });

  return { data, error };
}

/**
 * Get a single report by ID
 */
export async function getReport(reportId: string): Promise<{ data: Report | null; error: any }> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  return { data, error };
}

/**
 * Delete a report and all its associated files
 */
export async function deleteReport(reportId: string): Promise<{ error: any }> {
  try {
    // First, get the report to find all associated files
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) {
      return { error: fetchError };
    }

    if (!report) {
      return { error: { message: 'Report not found' } };
    }

    // Collect all file paths to delete
    const filesToDelete: string[] = [];

    // Add photo URLs
    if (report.photo_urls && Array.isArray(report.photo_urls)) {
      report.photo_urls.forEach((url: string) => {
        const path = extractStoragePath(url);
        if (path) filesToDelete.push(path);
      });
    }

    // Add map URLs
    if (report.map_urls && Array.isArray(report.map_urls)) {
      report.map_urls.forEach((url: string) => {
        const path = extractStoragePath(url);
        if (path) filesToDelete.push(path);
      });
    }

    // Add signature URL from site_assessor data
    if (report.site_assessor?.signatureUrl) {
      const path = extractStoragePath(report.site_assessor.signatureUrl);
      if (path) filesToDelete.push(path);
    }

    // Add plan PDF URLs from site_assessor data
    if (report.site_assessor?.planPdfUrls && Array.isArray(report.site_assessor.planPdfUrls)) {
      report.site_assessor.planPdfUrls.forEach((url: string) => {
        const path = extractStoragePath(url);
        if (path) filesToDelete.push(path);
      });
    }

    // Add generated PDF URL
    if (report.pdf_url) {
      const path = extractStoragePath(report.pdf_url);
      if (path) filesToDelete.push(path);
    }

    // Delete all files from storage
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('report-assets')
        .remove(filesToDelete);

      if (storageError) {
        console.warn('Some files could not be deleted from storage:', storageError);
        // Continue with report deletion even if file deletion fails
      }
    }

    // Finally, delete the report from the database
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    return { error: deleteError };
  } catch (err) {
    console.error('Error deleting report:', err);
    return { error: err };
  }
}

/**
 * Extract storage path from a Supabase Storage URL
 * Example: https://abc.supabase.co/storage/v1/object/public/report-assets/photos/file.jpg
 * Returns: photos/file.jpg
 */
function extractStoragePath(url: string): string | null {
  if (!url) return null;

  try {
    // Match the path after /report-assets/
    const match = url.match(/\/report-assets\/(.+)$/);
    return match ? match[1] : null;
  } catch (err) {
    console.warn('Failed to extract storage path from URL:', url);
    return null;
  }
}

/**
 * Mark report as completed
 */
export async function completeReport(reportId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('reports')
    .update({ status: 'completed' })
    .eq('id', reportId);

  return { error };
}

/**
 * Update site name
 */
export async function updateSiteName(reportId: string, siteName: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('reports')
    .update({ site_name: siteName })
    .eq('id', reportId);

  return { error };
}

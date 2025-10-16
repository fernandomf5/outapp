import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching page:', url);

    // Fetch the original page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    let html = await response.text();
    console.log('Page fetched successfully, length:', html.length);

    // Get the base URL for relative paths
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Convert relative URLs to absolute
    html = html.replace(/src="(?!http|\/\/|data:)([^"]+)"/gi, `src="${baseUrl}/$1"`);
    html = html.replace(/href="(?!http|\/\/|#|mailto:|tel:)([^"]+)"/gi, `href="${baseUrl}/$1"`);
    html = html.replace(/url\((?!http|\/\/|data:)['"]?([^'"\)]+)['"]?\)/gi, `url("${baseUrl}/$1")`);
    
    // Fix double slashes
    html = html.replace(/(https?:\/\/[^\/]+)\/\//g, '$1/');

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: html,
        originalUrl: url 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error cloning page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to clone page';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
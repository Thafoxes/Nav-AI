import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CommandRequest {
  text: string;
}

interface CommandResponse {
  intent: string;
  entities: Record<string, string>;
  response: string;
  action?: {
    type: string;
    payload?: Record<string, any>;
  };
}

const INTENTS = {
  NAVIGATE: 'navigate',
  CALL: 'call',
  CHECK_EARNINGS: 'check_earnings',
  ROUTE_CHANGE: 'route_change',
  REPORT_INCIDENT: 'report_incident',
  SHOW_INFO: 'show_info',
};

// Initialize Supabase client for embeddings
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text }: CommandRequest = await req.json();

    // Generate embeddings using Supabase's built-in AI
    const embeddingResponse = await supabase.functions.invoke('generate-embeddings', {
      body: { text },
    });

    // Process the command using the embeddings
    const { intent, entities, response, action } = await processCommand(text, embeddingResponse.data);

    return new Response(
      JSON.stringify({ intent, entities, response, action }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});

async function processCommand(
  text: string,
  embeddings: number[],
): Promise<CommandResponse> {
  const normalizedText = text.toLowerCase();

  // Navigation intents
  if (
    normalizedText.includes('navigate') ||
    normalizedText.includes('take me to') ||
    normalizedText.includes('go to') ||
    normalizedText.includes('drive to') ||
    normalizedText.includes('nearest')
  ) {
    let location = '';
    
    if (normalizedText.includes('petrol') || normalizedText.includes('gas station')) {
      location = 'Petronas Jalan Tun Razak';
    } else if (normalizedText.includes('rest stop') || normalizedText.includes('rest area')) {
      location = 'R&R Ayer Keroh';
    } else {
      // Extract location from the command
      const locationMatch = text.match(/(?:to|at|in)\s+(.+)$/i);
      location = locationMatch ? locationMatch[1].trim() : '';
    }

    return {
      intent: INTENTS.NAVIGATE,
      entities: { location },
      response: `I'll help you navigate to ${location}. Would you like to proceed?`,
      action: {
        type: 'SHOW_NAVIGATION_OVERLAY',
        payload: {
          location,
          distance: '1.2 km away', // This should be calculated based on actual location
        },
      },
    };
  }

  // Call intent
  if (normalizedText.includes('call')) {
    const target = normalizedText.includes('passenger') ? 'passenger' : 'support';
    return {
      intent: INTENTS.CALL,
      entities: { target },
      response: `Initiating call with ${target}.`,
      action: {
        type: 'INITIATE_CALL',
        payload: { target },
      },
    };
  }

  // Route change intents
  if (
    normalizedText.includes('avoid toll') ||
    normalizedText.includes('fastest route') ||
    normalizedText.includes('avoid traffic')
  ) {
    const preference = normalizedText.includes('toll')
      ? 'no_tolls'
      : normalizedText.includes('fastest')
      ? 'fastest'
      : 'avoid_traffic';

    return {
      intent: INTENTS.ROUTE_CHANGE,
      entities: { preference },
      response: `I'll update your route to ${
        preference === 'no_tolls'
          ? 'avoid toll roads'
          : preference === 'fastest'
          ? 'take the fastest path'
          : 'avoid traffic'
      }.`,
      action: {
        type: 'UPDATE_ROUTE',
        payload: { preference },
      },
    };
  }

  // Report incident intent
  if (normalizedText.includes('report') && normalizedText.includes('incident')) {
    return {
      intent: INTENTS.REPORT_INCIDENT,
      entities: {},
      response: 'I can help you report a road incident. What type of incident would you like to report?',
      action: {
        type: 'SHOW_INCIDENT_FORM',
      },
    };
  }

  // Show info intent
  if (normalizedText.includes('show') || normalizedText.includes('display')) {
    let infoType = '';
    if (normalizedText.includes('arrival')) infoType = 'arrival_time';
    else if (normalizedText.includes('earning')) infoType = 'earnings';
    else if (normalizedText.includes('rating')) infoType = 'rating';

    return {
      intent: INTENTS.SHOW_INFO,
      entities: { infoType },
      response: `Here's your ${infoType.replace('_', ' ')}.`,
      action: {
        type: 'DISPLAY_INFO',
        payload: { infoType },
      },
    };
  }

  // Default response for unrecognized commands
  return {
    intent: 'unknown',
    entities: {},
    response: "I'm not sure how to help with that. Could you please rephrase your request?",
  };
}
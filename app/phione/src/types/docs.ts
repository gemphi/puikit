export interface ApiEndpoint {
  id: string;
  namespace: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  parameters: Array<{ name: string; type: string; required: boolean; description: string }>;
  samplePayload?: Record<string, any>;
  sampleResponse: Record<string, any>;
  pythonSnippet: string;
  tsSnippet: string;
  curlSnippet: string;
}

export interface NamespaceDef {
  name: string;
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
}

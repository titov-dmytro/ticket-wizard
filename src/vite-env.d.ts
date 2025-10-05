/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string;
  readonly VITE_DYNAMODB_TABLE_NAME: string;
  readonly VITE_API_GATEWAY_URL: string;
  readonly VITE_NOVA_MICRO_API_KEY: string;
  readonly VITE_NOVA_MICRO_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// src/types.ts
interface INodeItem {
  label: string;
  children?: INodeItem[];
  description?: string;
  tooltip?: string;
  contextValue?: string;
}

interface IRestEndpointConfig {
  METHOD?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  HEADERS?: Record<string, string>;
  BODY_TEMPLATE?: Record<string, any>;
}

export {
  INodeItem,
  IRestEndpointConfig
}

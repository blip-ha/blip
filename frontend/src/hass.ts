// The slice of Home Assistant's frontend `hass` object Blip uses.

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
  last_reported?: string;
}

export interface EntityRegistryDisplayEntry {
  entity_id: string;
  device_id?: string | null;
  name?: string | null;
}

export interface DeviceRegistryEntry {
  id: string;
  name: string | null;
  name_by_user: string | null;
  manufacturer?: string | null;
  model?: string | null;
  model_id?: string | null;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  config?: { version?: string };
  entities?: Record<string, EntityRegistryDisplayEntry>;
  devices?: Record<string, DeviceRegistryEntry>;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ): Promise<unknown>;
}

/** Last time the entity reported, even if the value didn't change. */
export const lastSeen = (e: HassEntity) =>
  Math.max(
    new Date(e.last_updated).getTime(),
    e.last_reported ? new Date(e.last_reported).getTime() : 0,
  );

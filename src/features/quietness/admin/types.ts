export type QuietSpaceType =
  'ROOM' | 'LOUNGE' | 'MEDITATION_ROOM' | 'COMMON_AREA' | 'FACILITY' | 'OTHER'

export type NoiseDeviceStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONNECTED'

export type QuietSpace = {
  spaceId: number
  guesthouseId: number
  name: string
  type: QuietSpaceType
  active: boolean
}

export type NoiseDevice = {
  deviceId: number
  guesthouseId: number
  spaceId: number
  deviceName: string
  serialNumber: string
  modelName: string | null
  status: NoiseDeviceStatus
  installedAt: string
  lastConnectedAt: string | null
}

export type NoiseMeasurement = {
  measurementId: number
  deviceId: number
  guesthouseId: number
  spaceId: number
  decibel: number
  measuredAt: string
}

export type QuietSpaceCreateRequest = {
  guesthouseId: number
  name: string
  type: QuietSpaceType
}

export type NoiseDeviceCreateRequest = {
  guesthouseId: number
  spaceId: number
  deviceName: string
  serialNumber: string
  modelName?: string
}

export type NoiseMeasurementCreateRequest = {
  deviceId: number
  decibel: number
  measuredAt?: string
}

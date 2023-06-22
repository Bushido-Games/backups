export interface ReplicaSetStatusResponse {
  ok: number
  members?: ReplicaSetMember[]
}

export interface ReplicaSetMember {
  health: number
}

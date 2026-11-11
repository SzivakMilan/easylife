export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "bill_viewers": {
                  Row: {
                    "bill_id": string,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bill_id": string,"member_id": string
                  }
                  Update: {
                    "bill_id"?: string,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bill_viewers_bill_id_fkey"
      columns: ["bill_id"]
isOneToOne: false
      referencedRelation: "bills"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bill_viewers_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "household_members"
      referencedColumns: ["id"]
    }
                  ]
                },"bills": {
                  Row: {
                    "amount": number,"category_id": string | null,"created_at": string,"created_by": string,"due_date": string,"file_path": string | null,"household_id": string,"id": string,"issuer": string,"notified_at": string | null,"notified_offsets": (number)[],"paid_at": string | null,"recurrence": string,"reminder_offsets": (number)[],"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"category_id"?: string | null,"created_at"?: string,"created_by": string,"due_date": string,"file_path"?: string | null,"household_id": string,"id"?: string,"issuer": string,"notified_at"?: string | null,"notified_offsets"?: (number)[],"paid_at"?: string | null,"recurrence"?: string,"reminder_offsets"?: (number)[],"status"?: string
                  }
                  Update: {
                    "amount"?: number,"category_id"?: string | null,"created_at"?: string,"created_by"?: string,"due_date"?: string,"file_path"?: string | null,"household_id"?: string,"id"?: string,"issuer"?: string,"notified_at"?: string | null,"notified_offsets"?: (number)[],"paid_at"?: string | null,"recurrence"?: string,"reminder_offsets"?: (number)[],"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bills_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "budget_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bills_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"budget_categories": {
                  Row: {
                    "color": string,"created_at": string,"household_id": string,"icon": string,"id": string,"monthly_limit": number,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color": string,"created_at"?: string,"household_id": string,"icon": string,"id"?: string,"monthly_limit"?: number,"name": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"household_id"?: string,"icon"?: string,"id"?: string,"monthly_limit"?: number,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_categories_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"budget_items": {
                  Row: {
                    "amount": number,"category_id": string,"created_at": string,"created_by": string,"household_id": string,"id": string,"note": string | null,"occurred_on": string,"source_bill_id": string | null,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"category_id": string,"created_at"?: string,"created_by": string,"household_id": string,"id"?: string,"note"?: string | null,"occurred_on": string,"source_bill_id"?: string | null,"type": string
                  }
                  Update: {
                    "amount"?: number,"category_id"?: string,"created_at"?: string,"created_by"?: string,"household_id"?: string,"id"?: string,"note"?: string | null,"occurred_on"?: string,"source_bill_id"?: string | null,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_items_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "budget_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budget_items_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budget_items_source_bill_fk"
      columns: ["source_bill_id"]
isOneToOne: false
      referencedRelation: "bills"
      referencedColumns: ["id"]
    }
                  ]
                },"deadline_assignees": {
                  Row: {
                    "deadline_id": string,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "deadline_id": string,"member_id": string
                  }
                  Update: {
                    "deadline_id"?: string,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deadline_assignees_deadline_id_fkey"
      columns: ["deadline_id"]
isOneToOne: false
      referencedRelation: "deadlines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deadline_assignees_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "household_members"
      referencedColumns: ["id"]
    }
                  ]
                },"deadline_viewers": {
                  Row: {
                    "deadline_id": string,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "deadline_id": string,"member_id": string
                  }
                  Update: {
                    "deadline_id"?: string,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deadline_viewers_deadline_id_fkey"
      columns: ["deadline_id"]
isOneToOne: false
      referencedRelation: "deadlines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deadline_viewers_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "household_members"
      referencedColumns: ["id"]
    }
                  ]
                },"deadlines": {
                  Row: {
                    "created_at": string,"created_by": string,"description": string | null,"done": boolean,"due_date": string,"due_time": string | null,"household_id": string,"id": string,"notified_at": string | null,"notified_offsets": (number)[],"priority": string,"recurrence": string,"reminder_offsets": (number)[],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"description"?: string | null,"done"?: boolean,"due_date": string,"due_time"?: string | null,"household_id": string,"id"?: string,"notified_at"?: string | null,"notified_offsets"?: (number)[],"priority"?: string,"recurrence"?: string,"reminder_offsets"?: (number)[],"title": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"description"?: string | null,"done"?: boolean,"due_date"?: string,"due_time"?: string | null,"household_id"?: string,"id"?: string,"notified_at"?: string | null,"notified_offsets"?: (number)[],"priority"?: string,"recurrence"?: string,"reminder_offsets"?: (number)[],"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deadlines_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"event_participants": {
                  Row: {
                    "event_id": string,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "event_id": string,"member_id": string
                  }
                  Update: {
                    "event_id"?: string,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_participants_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_participants_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "household_members"
      referencedColumns: ["id"]
    }
                  ]
                },"event_viewers": {
                  Row: {
                    "event_id": string,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "event_id": string,"member_id": string
                  }
                  Update: {
                    "event_id"?: string,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_viewers_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_viewers_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "household_members"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "created_at": string,"created_by": string,"end_at": string | null,"household_id": string,"id": string,"location": string | null,"note": string | null,"notified_at": string | null,"notified_offsets": (number)[],"reminder_offsets": (number)[],"start_at": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"end_at"?: string | null,"household_id": string,"id"?: string,"location"?: string | null,"note"?: string | null,"notified_at"?: string | null,"notified_offsets"?: (number)[],"reminder_offsets"?: (number)[],"start_at": string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"end_at"?: string | null,"household_id"?: string,"id"?: string,"location"?: string | null,"note"?: string | null,"notified_at"?: string | null,"notified_offsets"?: (number)[],"reminder_offsets"?: (number)[],"start_at"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"household_links": {
                  Row: {
                    "created_at": string,"created_by": string,"household_a_id": string,"household_b_id": string,"id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"household_a_id": string,"household_b_id": string,"id"?: string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"household_a_id"?: string,"household_b_id"?: string,"id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_links_household_a_id_fkey"
      columns: ["household_a_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "household_links_household_b_id_fkey"
      columns: ["household_b_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"household_members": {
                  Row: {
                    "avatar_color": string,"created_at": string,"display_name": string,"household_id": string,"id": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_color"?: string,"created_at"?: string,"display_name": string,"household_id": string,"id"?: string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "avatar_color"?: string,"created_at"?: string,"display_name"?: string,"household_id"?: string,"id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_members_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"households": {
                  Row: {
                    "created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"invites": {
                  Row: {
                    "code": string,"created_at": string,"created_by": string,"expires_at": string | null,"household_id": string,"id": string,"kind": string,"redeemed_at": string | null,"redeemed_by_household_id": string | null,"redeemed_by_user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"created_by": string,"expires_at"?: string | null,"household_id": string,"id"?: string,"kind": string,"redeemed_at"?: string | null,"redeemed_by_household_id"?: string | null,"redeemed_by_user_id"?: string | null
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"created_by"?: string,"expires_at"?: string | null,"household_id"?: string,"id"?: string,"kind"?: string,"redeemed_at"?: string | null,"redeemed_by_household_id"?: string | null,"redeemed_by_user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_redeemed_by_household_id_fkey"
      columns: ["redeemed_by_household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"endpoint": string,"id": string,"member_id": string,"p256dh": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth": string,"created_at"?: string,"endpoint": string,"id"?: string,"member_id": string,"p256dh": string
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"endpoint"?: string,"id"?: string,"member_id"?: string,"p256dh"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_subscriptions_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "household_members"
      referencedColumns: ["id"]
    }
                  ]
                },"savings_contributions": {
                  Row: {
                    "amount": number,"created_at": string,"created_by": string,"goal_id": string,"household_id": string,"id": string,"note": string | null,"occurred_on": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"created_by": string,"goal_id": string,"household_id": string,"id"?: string,"note"?: string | null,"occurred_on": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"created_by"?: string,"goal_id"?: string,"household_id"?: string,"id"?: string,"note"?: string | null,"occurred_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "savings_contributions_goal_id_fkey"
      columns: ["goal_id"]
isOneToOne: false
      referencedRelation: "savings_goals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "savings_contributions_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"savings_goals": {
                  Row: {
                    "color": string,"created_at": string,"created_by": string,"household_id": string,"icon": string,"id": string,"name": string,"target_amount": number
                  }
                  ComputedFields: never
                  Insert: {
                    "color": string,"created_at"?: string,"created_by": string,"household_id": string,"icon": string,"id"?: string,"name": string,"target_amount": number
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"created_by"?: string,"household_id"?: string,"icon"?: string,"id"?: string,"name"?: string,"target_amount"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "savings_goals_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"shopping_items": {
                  Row: {
                    "checked": boolean,"created_at": string,"created_by": string,"household_id": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked"?: boolean,"created_at"?: string,"created_by": string,"household_id": string,"id"?: string,"name": string
                  }
                  Update: {
                    "checked"?: boolean,"created_at"?: string,"created_by"?: string,"household_id"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shopping_items_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"user_active_household": {
                  Row: {
                    "household_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "household_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "household_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_active_household_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "bill_owner_household":
{ Args: { "p_bill_id": string }; Returns: string
                           },
"create_household":
{ Args: { "p_avatar_color": string,"p_display_name": string,"p_name": string }; Returns: {
              "avatar_color": string,
"created_at": string,
"display_name": string,
"household_id": string,
"id": string,
"role": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "household_members"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_invite":
{ Args: { "p_expires_in_hours"?: number,"p_kind": string }; Returns: {
              "code": string,
"created_at": string,
"created_by": string,
"expires_at": string | null,
"household_id": string,
"id": string,
"kind": string,
"redeemed_at": string | null,
"redeemed_by_household_id": string | null,
"redeemed_by_user_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "invites"
        isOneToOne: true
        isSetofReturn: false
      } },
"deadline_owner_household":
{ Args: { "p_deadline_id": string }; Returns: string
                           },
"event_owner_household":
{ Args: { "p_event_id": string }; Returns: string
                           },
"my_connected_household_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"my_household_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"my_households":
{ Args: Record<PropertyKey, never>; Returns: {
              "household_id": string,"is_active": boolean,"member_id": string,"name": string,"role": string
            }[]
                           },
"redeem_household_link_invite":
{ Args: { "invite_code": string }; Returns: {
              "created_at": string,
"created_by": string,
"household_a_id": string,
"household_b_id": string,
"id": string,
"status": string
            }
                          SetofOptions: {
        from: "*"
        to: "household_links"
        isOneToOne: true
        isSetofReturn: false
      } },
"redeem_member_invite":
{ Args: { "invite_code": string,"p_avatar_color": string,"p_display_name": string }; Returns: {
              "avatar_color": string,
"created_at": string,
"display_name": string,
"household_id": string,
"id": string,
"role": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "household_members"
        isOneToOne: true
        isSetofReturn: false
      } },
"set_active_household":
{ Args: { "p_household_id": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

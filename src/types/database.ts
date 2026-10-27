
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
            "ai_usage": {
                  Row: {
                    "calls": number,"day": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "calls"?: number,"day"?: string,"user_id": string
                  }
                  Update: {
                    "calls"?: number,"day"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_usage_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"books": {
                  Row: {
                    "author": string | null,"cover_url": string | null,"created_at": string,"id": string,"openlibrary_work_key": string,"pages": number | null,"summary": string | null,"summary_lang": string | null,"summary_original": string | null,"summary_source": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author"?: string | null,"cover_url"?: string | null,"created_at"?: string,"id"?: string,"openlibrary_work_key": string,"pages"?: number | null,"summary"?: string | null,"summary_lang"?: string | null,"summary_original"?: string | null,"summary_source"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author"?: string | null,"cover_url"?: string | null,"created_at"?: string,"id"?: string,"openlibrary_work_key"?: string,"pages"?: number | null,"summary"?: string | null,"summary_lang"?: string | null,"summary_original"?: string | null,"summary_source"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"club_book_votes": {
                  Row: {
                    "approved": boolean,"club_book_id": string,"user_id": string,"voted_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved": boolean,"club_book_id": string,"user_id"?: string,"voted_at"?: string
                  }
                  Update: {
                    "approved"?: boolean,"club_book_id"?: string,"user_id"?: string,"voted_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_book_votes_club_book_id_fkey"
      columns: ["club_book_id"]
isOneToOne: false
      referencedRelation: "club_books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_book_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"club_books": {
                  Row: {
                    "book_id": string,"club_id": string,"created_at": string,"edition_number": number | null,"finished_on": string | null,"id": string,"proposed_by": string | null,"started_on": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "book_id": string,"club_id": string,"created_at"?: string,"edition_number"?: number | null,"finished_on"?: string | null,"id"?: string,"proposed_by"?: string | null,"started_on"?: string | null,"status"?: string
                  }
                  Update: {
                    "book_id"?: string,"club_id"?: string,"created_at"?: string,"edition_number"?: number | null,"finished_on"?: string | null,"id"?: string,"proposed_by"?: string | null,"started_on"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_books_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_books_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_books_proposed_by_fkey"
      columns: ["proposed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"club_members": {
                  Row: {
                    "club_id": string,"joined_at": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "club_id": string,"joined_at"?: string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "club_id"?: string,"joined_at"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_members_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"clubs": {
                  Row: {
                    "cover_url": string | null,"created_at": string,"created_by": string | null,"id": string,"invite_code": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"invite_code": string,"name": string
                  }
                  Update: {
                    "cover_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"invite_code"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clubs_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "created_at": string,"id": string,"type": string,"user_book_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"type"?: string,"user_book_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"type"?: string,"user_book_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_user_book_id_fkey"
      columns: ["user_book_id"]
isOneToOne: false
      referencedRelation: "user_books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"created_at": string,"id": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"id": string,"name"?: string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reading_list": {
                  Row: {
                    "book_id": string,"created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "book_id": string,"created_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "book_id"?: string,"created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reading_list_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reading_list_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_books": {
                  Row: {
                    "book_id": string,"comment": string | null,"created_at": string,"favorite_character": string | null,"favorite_quote": string | null,"finished_on": string | null,"id": string,"rank_characters": number | null,"rank_ending": number | null,"rank_plot": number | null,"rank_writing": number | null,"started_on": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "book_id": string,"comment"?: string | null,"created_at"?: string,"favorite_character"?: string | null,"favorite_quote"?: string | null,"finished_on"?: string | null,"id"?: string,"rank_characters"?: number | null,"rank_ending"?: number | null,"rank_plot"?: number | null,"rank_writing"?: number | null,"started_on": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "book_id"?: string,"comment"?: string | null,"created_at"?: string,"favorite_character"?: string | null,"favorite_quote"?: string | null,"finished_on"?: string | null,"id"?: string,"rank_characters"?: number | null,"rank_ending"?: number | null,"rank_plot"?: number | null,"rank_writing"?: number | null,"started_on"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_books_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_books_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_vote_club_book":
{ Args: { "p_club_book_id": string }; Returns: boolean
                           },
"consume_ai_quota":
{ Args: { "p_limit": number,"p_user_id": string }; Returns: boolean
                           },
"create_club":
{ Args: { "p_cover_url"?: string,"p_name": string }; Returns: {
              "cover_url": string | null,
"created_at": string,
"created_by": string | null,
"id": string,
"invite_code": string,
"name": string
            }
                          SetofOptions: {
        from: "*"
        to: "clubs"
        isOneToOne: true
        isSetofReturn: false
      } },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"evaluate_club_book":
{ Args: { "p_club_book_id": string }; Returns: undefined
                           },
"finish_club_book":
{ Args: { "p_club_book_id": string,"p_finished_on"?: string }; Returns: {
              "book_id": string,
"club_id": string,
"created_at": string,
"edition_number": number | null,
"finished_on": string | null,
"id": string,
"proposed_by": string | null,
"started_on": string | null,
"status": string
            }
                          SetofOptions: {
        from: "*"
        to: "club_books"
        isOneToOne: true
        isSetofReturn: false
      } },
"generate_invite_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"is_club_member":
{ Args: { "p_club_id": string }; Returns: boolean
                           },
"is_club_owner":
{ Args: { "p_club_id": string }; Returns: boolean
                           },
"is_club_owner_folder":
{ Args: { "p_folder": string }; Returns: boolean
                           },
"join_club":
{ Args: { "p_code": string }; Returns: {
              "cover_url": string | null,
"created_at": string,
"created_by": string | null,
"id": string,
"invite_code": string,
"name": string
            }
                          SetofOptions: {
        from: "*"
        to: "clubs"
        isOneToOne: true
        isSetofReturn: false
      } },
"propose_club_book":
{ Args: { "p_book_id": string,"p_club_id": string }; Returns: {
              "book_id": string,
"club_id": string,
"created_at": string,
"edition_number": number | null,
"finished_on": string | null,
"id": string,
"proposed_by": string | null,
"started_on": string | null,
"status": string
            }
                          SetofOptions: {
        from: "*"
        to: "club_books"
        isOneToOne: true
        isSetofReturn: false
      } },
"regenerate_invite_code":
{ Args: { "p_club_id": string }; Returns: string
                           },
"upsert_book":
{ Args: { "p_author"?: string,"p_cover_url"?: string,"p_pages"?: number,"p_summary"?: string,"p_title": string,"p_work_key": string }; Returns: {
              "author": string | null,
"cover_url": string | null,
"created_at": string,
"id": string,
"openlibrary_work_key": string,
"pages": number | null,
"summary": string | null,
"summary_lang": string | null,
"summary_original": string | null,
"summary_source": string,
"title": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "books"
        isOneToOne: true
        isSetofReturn: false
      } }
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

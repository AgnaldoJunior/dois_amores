import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { supabase, type Tables } from '@/lib/supabase'
import { resizeAvatar } from './imageResize'

export type Profile = Pick<Tables<'profiles'>, 'id' | 'name' | 'avatar_url' | 'bio'>

export const profileKeys = {
  detail: (userId: string) => ['profile', userId] as const,
}

export function useProfile() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: profileKeys.detail(user.id),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, bio')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateProfile() {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (changes: Partial<Pick<Profile, 'name' | 'bio' | 'avatar_url'>>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(changes)
        .eq('id', user.id)
        .select('id, name, avatar_url, bio')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.detail(user.id), profile),
  })
}

const avatarPath = (userId: string) => `${userId}/avatar.jpg`

/** Redimensiona no navegador, envia para avatars/<uid>/avatar.jpg e atualiza o perfil. */
export function useUploadAvatar() {
  const user = useCurrentUser()
  const update = useUpdateProfile()
  return useMutation({
    mutationFn: async (file: File) => {
      const blob = await resizeAvatar(file)
      const path = avatarPath(user.id)
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      // Parâmetro de versão para o navegador não mostrar a foto antiga em cache.
      return update.mutateAsync({ avatar_url: `${data.publicUrl}?v=${Date.now()}` })
    },
  })
}

/** Exclui a conta: remove a foto do Storage e chama a RPC que apaga os dados. */
export async function deleteMyAccount(userId: string) {
  await supabase.storage.from('avatars').remove([avatarPath(userId)])
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
  await supabase.auth.signOut({ scope: 'local' })
}

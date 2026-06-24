import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      setFavorites(data?.map((f) => f.property_id) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      toast.error('Iniciá sesión para guardar favoritos');
      return;
    }

    const isFavorite = favorites.includes(propertyId);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) {
        toast.error('Error al quitar de favoritos');
      } else {
        setFavorites((prev) => prev.filter((id) => id !== propertyId));
        toast.success('Quitado de favoritos');
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, property_id: propertyId });

      if (error) {
        toast.error('Error al agregar a favoritos');
      } else {
        setFavorites((prev) => [...prev, propertyId]);
        toast.success('Agregado a favoritos');
      }
    }
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  return { favorites, loading, toggleFavorite, isFavorite, fetchFavorites };
};

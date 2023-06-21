import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { IGroup } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import { AlbumsPreviewSizes, getStaticAlbums } from "@/pages/AAlbums/consts";
import { useVk } from "@/store/vk/vk";
import { RecycleScroller } from "vue-virtual-scroller";
import { useCountGridColumns } from "@/hooks/useCountGridColumns";
import { useScreenSpinner } from "@/hooks/useScreenSpinner";

export function useAlbums(ownerIdGetter: MaybeRefOrGetter<number | string>) {
  const ownerId = computed(() => toValue(ownerIdGetter));
  const isInit = ref(false);
  useScreenSpinner(() => !isInit.value);
  const albums = ref<IAlbumItem[]>([]);
  const albumsMaxItems = ref(0);
  const isLoadingAlbums = ref(false);
  const group = ref<IGroup | undefined>();
  const staticAlbums = computed(() => getStaticAlbums(ownerId.value));
  const albumsRef = ref<InstanceType<typeof RecycleScroller>>();
  const gridItems = useCountGridColumns(
    albumsRef,
    () => AlbumsPreviewSizes.value.width
  );
  const screenError = ref<any>();

  const countOneLoad = 200;

  const onClearComponent = () => {
    isInit.value = false;
    isLoadingAlbums.value = false;
    albums.value.length = 0;
    albumsMaxItems.value = 0;
    group.value = undefined;
    screenError.value = undefined;
  };

  watch(
    ownerId,
    async () => {
      onClearComponent();
      if (+ownerId.value < 0) {
        try {
          group.value = await useGroups().getGroupByIdOrLoad(-ownerId.value);
        } catch {}
      }

      albumsMaxItems.value = countOneLoad; // это инициирует первую загрузку
    },
    { immediate: true }
  );

  watch(
    albumsMaxItems,
    async () => {
      if (isLoadingAlbums.value || albumsMaxItems.value === 0) {
        return;
      }

      isLoadingAlbums.value = true;
      if (albums.value.length === 0) {
        albums.value.push(...staticAlbums.value);
      }

      const offset = albums.value.length - staticAlbums.value.length;
      const count = albumsMaxItems.value - offset;
      try {
        const { items } = await useVk().getAlbums(ownerId.value, offset, count);
        albums.value.push(...items);
      } catch (ex: any) {
        screenError.value = ex;
        if (albums.value.length === staticAlbums.value.length) {
          albums.value.length = 0;
        }
      }

      isLoadingAlbums.value = false;
      isInit.value = true;
      albumsRef.value?.updateVisibleItems(true);
    },
    { immediate: true }
  );

  const onScrollerUpdate = (
    startIndex: number,
    endIndex: number,
    visibleStartIndex: number,
    visibleEndIndex: number
  ) => {
    if (endIndex + countOneLoad / 3 < albumsMaxItems.value) {
      return;
    }

    albumsMaxItems.value += countOneLoad;
  };

  return {
    isInit,
    group,
    albums,
    isLoadingAlbums,
    gridItems,
    onScrollerUpdate,
    albumsRef,
    screenError,
  };
}

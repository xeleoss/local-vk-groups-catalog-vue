<script lang="ts" setup>
import { useRoute } from "vue-router";
import copy from "copy-to-clipboard";
import AButton from "@/components/AButton/AButton.vue";
import { useColorScheme } from "@/useColorScheme";
import { useApp } from "@/store/app/app";
import { darkColorScheme, icons } from "@/common/consts";
import { useGroups } from "@/store/groups/groups";
import { useVk } from "@/store/vk/vk";
import Loading from "vue3-loading-overlay";
import { onBeforeMount, onMounted, ref, watch } from "vue";
import { switchFullscreen } from "@/helpers/switchFullscreen";
import { VDefaultsProvider } from "vuetify/components";

const route = useRoute();
const groupsStore = useGroups();
const vkStore = useVk();
const appStore = useApp();
const { currentClasses } = useColorScheme();
const { Icon24Linked } = icons;

const fullscreenElement = ref(document.fullscreenElement);

watch(fullscreenElement, () => {
  appStore.isFullScreen = !!fullscreenElement.value;
});

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === "F11" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    switchFullscreen();
  }
};

const init = ref(false);

onBeforeMount(async () => {
  try {
    await vkStore.init();
    await groupsStore.init();
  } finally {
    init.value = true;
  }
});

onMounted(() => {
  document.documentElement.addEventListener("fullscreenchange", () => {
    fullscreenElement.value = document.fullscreenElement;
  });
});

const vuetifyDefaults: VDefaultsProvider["defaults"] = {
  VLabel: {},
  VDialog: {
    closeOnBack: true,
    scrim: "black",
  },
  global: {
    clearable: true,
  },
};
</script>

<template>
  <VThemeProvider :theme="darkColorScheme ? 'dark' : 'light'">
    <VDefaultsProvider :defaults="vuetifyDefaults">
      <div
        :class="currentClasses"
        :data-dark="darkColorScheme"
        :data-fullscreen="appStore.isFullScreen"
        :data-platform="appStore.platform"
        class="overflow-block root"
        tabindex="0"
        @keydown="onKeyDown"
      >
        <Loading
          :active="!groupsStore.isInit || appStore.isLoading"
          :opacity="0.3"
          background-color="#000"
          color="#eee"
          is-full-page
          lock-scroll
        />
        <template v-if="groupsStore.isInit">
          <div class="navigation-header">
            <div id="caption" class="overflow-block navigation-caption">
              {{ appStore.caption }}
            </div>
            <AButton
              v-if="route.path !== '/'"
              style="height: 30px"
              @click="copy('vk.com/app51658481#' + route.path)"
            >
              <Icon24Linked />
            </AButton>
            <AButton
              v-if="useApp().isVkCom"
              :icon="
                fullscreenElement ? 'Icon24FullscreenExit' : 'Icon24Fullscreen'
              "
              style="height: 30px"
              @click="switchFullscreen()"
            />
          </div>
          <div class="overflow-block route-view">
            <router-view v-if="init" v-slot="{ Component }">
              <keep-alive :max="3" exclude="AAlbum">
                <component :is="Component" />
              </keep-alive>
            </router-view>
          </div>
          <div class="navigation">
            <div class="navigation-bottom-buttons">
              <AButton
                :hide-content="!appStore.isVkCom"
                :icon="icons.Icon24ArticleBoxOutline"
                to="/"
              >
                <span> Группы </span>
              </AButton>
              <AButton
                :hide-content="!appStore.isVkCom"
                :icon="icons.Icon24AddSquareOutline"
                to="/add"
              >
                <span> Добавить </span>
              </AButton>
              <AButton
                :hide-content="!appStore.isVkCom"
                :icon="icons.Icon24GearOutline"
                to="/settings"
              >
                <span> Настройки </span>
              </AButton>
              <AButton
                :hide-content="!appStore.isVkCom"
                :icon="icons.Icon24LightbulbStarOutline"
                to="/about"
              >
                <span> О приложении </span>
              </AButton>
            </div>
          </div>
        </template>
      </div>
    </VDefaultsProvider>
  </VThemeProvider>
</template>

<style lang="scss">
.root {
  padding-top: 2px;
  padding-block: 10px;
  gap: 10px;
  background: var(--vkui--color_background_content);
}

.route-view {
}

.navigation-header {
  display: flex;
  align-items: center;
  padding-inline: 10px;
  padding-right: var(--navigation-header-padding-right, 10px);
  min-height: 30px;
  gap: 5px;

  @at-root .root[data-fullscreen="true"] & {
    padding-right: 10px;
  }
}

.navigation {
  display: flex;
  align-items: center;
  padding-inline: 10px;
}

.navigation-caption {
  display: flex;
  align-items: flex-start;
  justify-items: center;
  justify-content: center;
  font-weight: bold;
  text-transform: uppercase;
  font-size: min(calc(0.3em + 2vw), 18px);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;

  a {
    color: inherit;
    font-weight: inherit;
    font-size: inherit;
    text-transform: inherit;
    text-decoration: inherit;
    text-overflow: inherit;
    white-space: inherit;
    overflow: inherit;
    max-width: inherit;
  }
}

.navigation-bottom-buttons {
  display: flex;
  gap: 5px;
  align-items: center;
  overflow: auto;
  padding: 10px;
  background: var(--vkui--color_background);
  min-width: 100%;
  border-radius: 5px;

  & > * {
    flex-grow: 1;
  }

  @at-root .root:not([data-platform="vkcom"]) & {
    justify-content: space-around;
    align-content: space-around;
  }

  .a-button {
    min-height: 26px;
    white-space: nowrap;
  }
}

//.root[data-platform=android] {
//  .navigation-bottom-buttons {
//    //]:not[platform=vkcom] {
//    justify-content: space-around;
//    align-content: space-around;
//  }
//}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s linear;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}
</style>

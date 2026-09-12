import type Phaser from 'phaser';
import { getRuntime } from '../application/runtime/runtimeBridge';
import type { AvatarSelection } from '../application/play/playSession';
import type { ProfileId } from '../domain/profiles/profile';
import { KeyboardInputAdapter } from '../presentation/input/keyboardInputAdapter';
import type { PlayShellScene } from '../presentation/phaser/scenes/PlayShellScene';

interface InteractionResolvedDetail {
  readonly targetId: string;
  readonly alreadyCompleted: boolean;
  readonly technicalInteractionsCompleted: number;
}

export function startDevelopmentHarness(game: Phaser.Game): void {
  const root = document.querySelector<HTMLElement>('#dev-harness');
  if (!root) return;
  const runtime = getRuntime();
  const keyboard = new KeyboardInputAdapter(runtime.bus);
  keyboard.start();

  const renderProfiles = (): void => {
    runtime.clearSession();
    root.dataset.screen = 'profiles';
    const profiles = runtime.profiles.list();
    const active = runtime.profiles.getActive();
    root.innerHTML = `<section class="dev-panel profile-panel" aria-label="Choix du profil"><strong>TREASURE POP — WONDERLANDS</strong><h1>Qui part à l’aventure ?</h1><p>Les profils et sauvegardes restent sur cet appareil.</p><label>Prénom ou surnom <input id="profile-name" maxlength="24" autocomplete="off" /></label><button id="create-profile">Créer mon profil</button><div id="profiles">${profiles.map((profile) => `<article class="profile-row"><button class="profile-choice" data-profile-id="${profile.profileId}">${escapeHtml(profile.displayName)}${profile.profileId === active?.profileId ? ' — choisi' : ''}</button><button class="rename-profile" data-profile-id="${profile.profileId}">Renommer</button><button class="delete-profile" data-profile-id="${profile.profileId}">Supprimer</button></article>`).join('')}</div><button id="play-profile" ${active ? '' : 'disabled'}>Continuer</button><output id="profile-status">${active ? `Profil : ${escapeHtml(active.displayName)}` : 'Crée ou choisis un profil.'}</output></section>`;
    root.querySelector('#create-profile')?.addEventListener('click', () => {
      const input = root.querySelector<HTMLInputElement>('#profile-name');
      if (!input) return;
      try {
        runtime.profiles.create(input.value);
        runtime.persistProfiles();
        renderProfiles();
      } catch (error) {
        root.dataset.error = String(error);
      }
    });
    root.querySelectorAll<HTMLElement>('.profile-choice').forEach((button) =>
      button.addEventListener('click', () => {
        runtime.profiles.select(button.dataset.profileId as ProfileId);
        runtime.persistProfiles();
        renderProfiles();
      }),
    );
    root.querySelectorAll<HTMLElement>('.rename-profile').forEach((button) =>
      button.addEventListener('click', () => {
        const name = window.prompt('Nouveau prénom ou surnom');
        if (name === null) return;
        runtime.profiles.rename(button.dataset.profileId as ProfileId, name);
        runtime.persistProfiles();
        renderProfiles();
      }),
    );
    root.querySelectorAll<HTMLElement>('.delete-profile').forEach((button) =>
      button.addEventListener('click', () => {
        if (!window.confirm('Supprimer ce profil local et sa sauvegarde ?')) return;
        const profileId = button.dataset.profileId as ProfileId;
        runtime.profiles.remove(profileId);
        runtime.persistProfiles();
        void runtime.saves.deleteProfile(profileId);
        renderProfiles();
      }),
    );
    root.querySelector('#play-profile')?.addEventListener('click', () => void prepareAdventure());
  };

  const prepareAdventure = async (): Promise<void> => {
    const session = await runtime.startActiveSession();
    if (!session) return;
    const progress = session.getProgress();
    if (progress.storyStep > 0) {
      enterPlay();
      return;
    }
    renderAvatarCreator(progress.avatar);
  };

  const renderAvatarCreator = (avatar: AvatarSelection): void => {
    const session = runtime.getSession();
    if (!session) return;
    root.dataset.screen = 'avatar';
    root.innerHTML = `<section class="dev-panel avatar-panel" aria-label="Créateur d’avatar"><strong>TON HÉROS</strong><h1>Crée ton aventurier</h1><p>Aucun choix garçon/fille : mélange simplement ce que tu aimes.</p>${avatarGroup('skin', 'Teinte de peau', 4, avatar.skin)}${avatarGroup('hair', 'Cheveux', 4, avatar.hair)}${avatarGroup('outfit', 'Tenue', 4, avatar.outfit)}${avatarGroup('accessory', 'Accessoire', 4, avatar.accessory)}<button id="start-adventure" class="primary-adventure">Entrer dans Wonderlands</button></section>`;
    root.querySelector('#start-adventure')?.addEventListener('click', () => {
      const selected: AvatarSelection = {
        skin: selectedValue(root, 'skin', 1),
        hair: selectedValue(root, 'hair', 1),
        outfit: selectedValue(root, 'outfit', 1),
        accessory: selectedValue(root, 'accessory', 0),
      };
      void session.setAvatar(selected).then(() => session.setStoryLocation(1, 'prologue')).then(enterPlay);
    });
  };

  const enterPlay = (): void => {
    const session = runtime.getSession();
    if (!session) return;
    root.dataset.screen = 'play';
    root.innerHTML = `<section class="play-hud" aria-label="Contrôles de Wonderlands"><div class="play-status"><strong id="location-output">WONDERLANDS — ${escapeHtml(session.profile.displayName)}</strong><output id="progress-output"></output><output id="interaction-output">Observe le monde et touche ce qui brille.</output><small>Un clic ou un tap suffit. Le clavier reste optionnel.</small></div><button id="pause-button" class="pause-button" type="button">Pause</button><div id="pause-panel" class="pause-panel" hidden><strong>PAUSE</strong><button id="resume-button">Reprendre</button><button id="profiles-button">Profils</button></div></section>`;
    updateProgress();
    playScene().resumePlay();
    playScene().syncAdventureFromSave();
    root.querySelector('#pause-button')?.addEventListener('click', () => playScene().togglePause());
    root.querySelector('#resume-button')?.addEventListener('click', () => {
      playScene().resumePlay();
      setPausePanel(false);
    });
    root.querySelector('#profiles-button')?.addEventListener('click', renderProfiles);
  };

  const playScene = (): PlayShellScene => game.scene.getScene('PlayShellScene') as PlayShellScene;
  const setPausePanel = (paused: boolean): void => {
    const panel = root.querySelector<HTMLElement>('#pause-panel');
    if (panel) panel.hidden = !paused;
  };
  const updateProgress = (): void => {
    const output = root.querySelector<HTMLOutputElement>('#progress-output');
    const location = root.querySelector<HTMLElement>('#location-output');
    const progress = runtime.getSession()?.getProgress();
    if (output && progress) {
      output.value = `Découvertes : ${String(progress.technicalInteractionsCompleted)} · Récompenses : ${String(progress.rewardIds.length)}`;
    }
    if (location && progress) location.textContent = progress.currentZoneId.replaceAll('-', ' ').toUpperCase();
  };
  const updateInteractionFeedback = (detail: InteractionResolvedDetail): void => {
    const output = root.querySelector<HTMLOutputElement>('#interaction-output');
    if (!output) return;
    output.value = detail.alreadyCompleted ? 'Déjà découvert — continue ton exploration.' : 'Découverte enregistrée !';
  };
  window.addEventListener('wonderlands:pause-changed', (event) => setPausePanel((event as CustomEvent<boolean>).detail));
  window.addEventListener('wonderlands:progress-changed', updateProgress);
  window.addEventListener('wonderlands:interaction-resolved', (event) => updateInteractionFeedback((event as CustomEvent<InteractionResolvedDetail>).detail));
  window.addEventListener('wonderlands:interaction-save-error', () => {
    const output = root.querySelector<HTMLOutputElement>('#interaction-output');
    if (output) output.value = 'La sauvegarde a échoué. Touche de nouveau pour réessayer.';
  });
  renderProfiles();
}

function avatarGroup(name: string, label: string, count: number, selected: number): string {
  return `<fieldset class="avatar-group"><legend>${label}</legend><div class="avatar-tiles">${Array.from({ length: count }, (_, index) => {
    const value = name === 'accessory' ? index : index + 1;
    return `<label class="avatar-tile"><input type="radio" name="${name}" value="${String(value)}" ${value === selected ? 'checked' : ''}/><span>${name === 'accessory' && value === 0 ? 'Aucun' : `${label} ${String(value)}`}</span></label>`;
  }).join('')}</div></fieldset>`;
}

function selectedValue(root: HTMLElement, name: string, fallback: number): number {
  const input = root.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  return input ? Number(input.value) : fallback;
}

function escapeHtml(value: string): string {
  const node = document.createElement('span');
  node.textContent = value;
  return node.innerHTML;
}

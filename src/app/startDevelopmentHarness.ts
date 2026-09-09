import type Phaser from 'phaser';
import { getRuntime } from '../application/runtime/runtimeBridge';
import type { ProfileId } from '../domain/profiles/profile';
import { KeyboardInputAdapter } from '../presentation/input/keyboardInputAdapter';
import type { PlayShellScene } from '../presentation/phaser/scenes/PlayShellScene';

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
    root.innerHTML = `<section class="dev-panel" aria-label="Technical profile select"><strong>PROFILE SELECT — TECHNICAL UI</strong><p>No personal data. Temporary shell.</p><label>Profile name <input id="profile-name" maxlength="24" autocomplete="off" /></label><button id="create-profile">Create profile</button><div id="profiles">${profiles.map((profile) => `<article class="profile-row"><button class="profile-choice" data-profile-id="${profile.profileId}">${escapeHtml(profile.displayName)}${profile.profileId === active?.profileId ? ' — ACTIVE' : ''}</button><button class="rename-profile" data-profile-id="${profile.profileId}">Rename</button><button class="delete-profile" data-profile-id="${profile.profileId}">Delete</button></article>`).join('')}</div><button id="play-profile" ${active ? '' : 'disabled'}>Play active profile</button><output id="profile-status">${active ? `Active: ${escapeHtml(active.displayName)}` : 'Create or select a profile.'}</output></section>`;
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
        const name = window.prompt('New profile name');
        if (name === null) return;
        runtime.profiles.rename(button.dataset.profileId as ProfileId, name);
        runtime.persistProfiles();
        renderProfiles();
      }),
    );
    root.querySelectorAll<HTMLElement>('.delete-profile').forEach((button) =>
      button.addEventListener('click', () => {
        if (!window.confirm('Delete this local profile and its save?')) return;
        const profileId = button.dataset.profileId as ProfileId;
        runtime.profiles.remove(profileId);
        runtime.persistProfiles();
        void runtime.saves.deleteProfile(profileId);
        renderProfiles();
      }),
    );
    root.querySelector('#play-profile')?.addEventListener('click', () => void enterPlay());
  };

  const enterPlay = async (): Promise<void> => {
    const session = await runtime.startActiveSession();
    if (!session) return;
    root.dataset.screen = 'play';
    root.innerHTML = `<section class="play-hud" aria-label="Click and tap play controls"><div class="play-status"><strong>WONDER WORLD — ${escapeHtml(session.profile.displayName)}</strong><output id="progress-output"></output><output id="interaction-output">Click or tap the glowing gold discovery.</output><small>Mouse or touch is enough to play. Keyboard is optional.</small></div><button id="pause-button" class="pause-button" type="button">Pause</button><div id="pause-panel" class="pause-panel" hidden><strong>PAUSED</strong><button id="resume-button">Resume</button><button id="profiles-button">Profile select</button></div></section>`;
    updateProgress();
    playScene().resumePlay();
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
    const progress = runtime.getSession()?.getProgress();
    if (output && progress)
      output.value = `Discoveries: ${String(progress.technicalInteractionsCompleted)}`;
  };
  window.addEventListener('wonderlands:pause-changed', (event) => {
    setPausePanel((event as CustomEvent<boolean>).detail);
  });
  window.addEventListener('wonderlands:progress-changed', updateProgress);
  renderProfiles();
}

function escapeHtml(value: string): string {
  const node = document.createElement('span');
  node.textContent = value;
  return node.innerHTML;
}

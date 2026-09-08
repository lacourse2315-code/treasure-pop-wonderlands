import { ProfileRegistry } from '../domain/profiles/profileRegistry';
import { createSaveEnvelope } from '../domain/save/saveContract';
import { PlayerCommandBus, type PlayerCommand } from '../domain/input/playerCommand';
import { IndexedDbSaveStore } from '../infrastructure/save/indexedDbSaveStore';
import { SaveService } from '../application/save/saveService';
import { KeyboardInputAdapter } from '../presentation/input/keyboardInputAdapter';
import { TouchInputAdapter } from '../presentation/input/touchInputAdapter';

export function startDevelopmentHarness(): void {
  const root = document.querySelector<HTMLElement>('#dev-harness');
  if (!root) return;
  const registry = new ProfileRegistry();
  const saves = new SaveService(new IndexedDbSaveStore());
  const bus = new PlayerCommandBus();
  const keyboard = new KeyboardInputAdapter(bus);
  const touch = new TouchInputAdapter(bus, root);
  keyboard.start(); touch.start();
  let command: PlayerCommand | null = null;
  bus.subscribe((next) => { command = next; root.dataset.lastCommand = next; render(); });

  const render = (): void => {
    const profiles = registry.list(); const active = registry.getActive();
    root.innerHTML = `<section class="dev-panel"><strong>DEVELOPMENT / NON-FINAL UI</strong><label>Profile name <input id="profile-name" maxlength="24" /></label><button id="create-profile">Create profile</button><div id="profiles">${profiles.map((profile) => `<button class="profile-choice" data-profile-id="${profile.profileId}">${escapeHtml(profile.displayName)}</button>`).join('')}</div><label>Progress value <input id="progress-value" inputmode="numeric" value="0" /></label><button id="save-progress">Save</button><button id="load-progress">Load</button><output id="save-output">active=${active?.displayName ?? 'none'}</output><div class="dev-touch"><button data-player-command="move-left">Left</button><button data-player-command="primary-action">Action</button><button data-player-command="move-right">Right</button></div><output id="command-output">command=${command ?? 'none'}</output></section>`;
    root.querySelector('#create-profile')?.addEventListener('click', () => { const input = root.querySelector<HTMLInputElement>('#profile-name'); if (!input) return; try { registry.create(input.value); render(); } catch (error) { root.dataset.error = String(error); } });
    root.querySelectorAll<HTMLElement>('.profile-choice').forEach((button) => button.addEventListener('click', () => { registry.select(button.dataset.profileId as never); render(); }));
    root.querySelector('#save-progress')?.addEventListener('click', async () => { const profile = registry.getActive(); const input = root.querySelector<HTMLInputElement>('#progress-value'); if (!profile || !input) return; await saves.save(profile.profileId, createSaveEnvelope(profile, { progressValue: Number(input.value) })); root.dataset.saveStatus = 'saved'; });
    root.querySelector('#load-progress')?.addEventListener('click', async () => { const profile = registry.getActive(); if (!profile) return; const loaded = await saves.load(profile.profileId); const output = root.querySelector<HTMLOutputElement>('#save-output'); if (output) output.value = JSON.stringify(loaded.save?.payload ?? null); root.dataset.saveStatus = loaded.save ? 'loaded' : 'empty'; });
  };
  render();
}

function escapeHtml(value: string): string { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; }

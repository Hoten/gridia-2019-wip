import * as Content from '../../content';
import ClientModule from '../client-module';
import * as Helper from '../helper';

class SkillsClientModule extends ClientModule {
  protected panel: HTMLElement;

  public onStart() {
    this.panel = Helper.find('.panel--skills');

    this.client.eventEmitter.on('message', (e) => {
      // TODO improve type checking.
      if (e.type === 'initialize') {
        this.renderSkills();
      }

      if (e.type === 'xp') {
        const statusTextEl = document.createElement('div');
        statusTextEl.classList.add('status-text');
        setTimeout(() => statusTextEl.classList.add('status-text--remove'), 500);
        statusTextEl.innerText = `+${e.args.xp}xp ${Content.getSkill(e.args.skill).name}`;
        // TODO: add one listener to .status-texts
        statusTextEl.addEventListener('transitionend', () => statusTextEl.remove());
        Helper.find('.status-texts').appendChild(statusTextEl);

        // This is crap.
        this.renderSkills();
      }
    });
  }

  protected renderSkills() {
    const skillsEl = Helper.find('.skills', this.panel);
    skillsEl.innerHTML = '';

    const sortedByName = [...this.client.skills.keys()].sort(
      (a, b) => Content.getSkill(a).name.localeCompare(Content.getSkill(b).name));
    for (const skillId of sortedByName) {
      const skill = Content.getSkill(skillId);
      const xp = this.client.skills.get(skillId);
      const skillEl = document.createElement('div');
      skillEl.classList.add('skill');
      skillEl.innerText = `${skill.name} (${xp})`;
      skillsEl.appendChild(skillEl);
    }
  }
}

export default SkillsClientModule;

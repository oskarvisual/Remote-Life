export class MobileNotice {
  private readonly dialog: HTMLDialogElement;

  constructor(dialogElement: HTMLDialogElement) {
    this.dialog = dialogElement;
  }

  show(): void {
    this.dialog.innerHTML = `
      <div class="start-card mobile-notice-card">
        <p class="eyebrow">REMOTE LIFE // DESKTOP REQUIRED</p>
        <h1>DESKTOP<br>ONLY.</h1>
        <p>This game is designed for desktop computers and requires a keyboard to play.</p>
        <p class="start-foot">Please open Remote Life on a desktop or laptop computer.</p>
      </div>
    `;

    this.dialog.addEventListener('cancel', (event) => event.preventDefault());
    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }
}

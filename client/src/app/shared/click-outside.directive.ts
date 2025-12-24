import { Directive, ElementRef, EventEmitter, Output, Input, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Input() appClickOutsideEnabled = true;
  @Output('appClickOutside') readonly clickedOutside = new EventEmitter<Event>();

  constructor(
    private hostRef: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private handleEvent(ev: Event) {
    if (!this.appClickOutsideEnabled) return;
    if (!isPlatformBrowser(this.platformId)) return;
    const hostEl = this.hostRef.nativeElement;
    const target = ev.target as Node | null;
    if (hostEl && target && !hostEl.contains(target)) {
      this.clickedOutside.emit(ev);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: Event) {
    this.handleEvent(ev);
  }

  @HostListener('document:touchstart', ['$event'])
  onDocumentTouch(ev: Event) {
    this.handleEvent(ev);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(ev: KeyboardEvent) {
    if (!this.appClickOutsideEnabled) return;
    if (!isPlatformBrowser(this.platformId)) return;
    this.clickedOutside.emit(ev);
  }
}

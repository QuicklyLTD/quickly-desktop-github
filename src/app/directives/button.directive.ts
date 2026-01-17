import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appOneShot]'
})
export class ButtonDirective {

  @Input() appOneShot: any;

  constructor(private element: ElementRef) { }

  @HostListener('click') onClick() {
    // If used as <button appOneShot>, appOneShot is "". Treat as true.
    // If used as <button [appOneShot]="condition">, appOneShot is the condition.
    const active = this.appOneShot === '' || this.appOneShot;

    if (active) {
      this.element.nativeElement.disabled = true;
    }
  }
}

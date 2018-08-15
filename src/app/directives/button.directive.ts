import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[oneShot]'
})
export class ButtonDirective {

  @Input('oneShot') isActive: any;

  constructor(private element: ElementRef) {
    if (this.isActive) {
      this.isActive = true;
    }
  }

  @HostListener('click') onClick() {
    if (this.isActive) {
      this.element.nativeElement.disabled = true;
    }
  }
}

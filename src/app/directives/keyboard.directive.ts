import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { KeyboardService } from '../providers/keyboard.service';

@Directive({
  selector: 'input:not([type="checkbox"]):not([id="keyboardElement"])'
})
export class KeyboardDirective {
  onAir: boolean;

  constructor(private element: ElementRef, private keyboardService: KeyboardService) {
    this.onAir = false;
  }

  @HostListener('click') onClick() {
    this.keyboardService.triggerKeyboard('Open', this.element);
  }

  @HostListener('input') onInput() {
    this.element.nativeElement.focus();
    // console.log(this.element.nativeElement.selectionStart);
  }

  @HostListener('blur') onBlur() {
    // this.keyboardService.triggerKeyboard('Close', this.element);
  }

}

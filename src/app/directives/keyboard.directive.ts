import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { KeyboardService } from '../providers/keyboard.service';

@Directive({
  selector: 'input:not([type="checkbox"]):not([id="keyboardElement"]):not([readonly]),textarea:not([readonly])'
})
export class KeyboardDirective {
  onAir: boolean;

  constructor(private element: ElementRef, private keyboardService: KeyboardService, private renderer: Renderer2) {
    this.onAir = false;
  }

  @HostListener('click') onClick(event) {
    this.keyboardService.triggerKeyboard('Open', this.element);
    let inputElement = this.element.nativeElement;
    
    // console.log(inputElement.getBoundingClientRect()); 

  }
  @HostListener('input') onInput() {
    this.element.nativeElement.focus();
    // console.log(this.element.nativeElement.selectionStart);
  }
  @HostListener('blur') onBlur() {
    // this.keyboardService.triggerKeyboard('Close', this.element);
  }

}

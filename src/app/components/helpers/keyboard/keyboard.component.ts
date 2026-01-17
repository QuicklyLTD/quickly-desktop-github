import { Component, ElementRef, OnInit, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { KeyboardService } from '../../../core/providers/keyboard.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-keyboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss'],
})

export class KeyboardComponent implements OnInit, OnDestroy {
  keytype: Array<any>;
  keyboard: Array<any>;
  numboard: Array<any>;
  keyIndex: number;
//   signalListener: Subscription; // Unused
  selectedInput: ElementRef;
  selectedForm: NgForm;
  onAir: boolean;
  onNumb: boolean;
  keyboardInput: any;
  inputType: string;
  keyboardStatus: boolean;
  placeholder: string;
  private settingsSub: Subscription;
  private inputSub: Subscription;
  private keyboardSub: Subscription;
  private focusListener: (() => void) | null = null;

  constructor(private keyboardService: KeyboardService, private settings: SettingsService, private renderer: Renderer2) {
    this.settingsSub = this.settings.AppSettings.subscribe(res => {
      if (res) {
        const keyboardSetting = (res as any)?.value?.keyboard ?? (res as any)?.keyboard;
        if (keyboardSetting === 'Açık') {
          this.keyboardStatus = true;
        } else {
          this.keyboardStatus = false;
        }
      } else {
        this.keyboardStatus = false;
      }
    });
    this.keyIndex = 0;
    this.keyboard = [
      [['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '\u00a8'], ['7', '&'], ['8', '*'], ['9', '('],
      ['0', ')'], ['*', '?'], ['-', '_'], ['◂', '◂']],
      [['q', 'Q'], ['w', 'W'], ['e', 'E'], ['r', 'R'], ['t', 'T'], ['y', 'Y'], ['u', 'U'], ['ı', 'I'], ['o', 'O'],
      ['p', 'P'], ['ğ', 'Ğ'], ['ü', 'Ü'], ['▴', '▴']],
      [['a', 'A'], ['s', 'S'], ['d', 'D'], ['f', 'F'], ['g', 'G'], ['h', 'H'], ['j', 'J'], ['k', 'K'], ['l', 'L'],
      ['ş', 'Ş'], ['i', 'İ'], [',', ';'], ['▾', '▾']],
      [['\\', '|'], ['z', 'Z'], ['x', 'X'], ['c', 'C'], ['v', 'V'], ['b', 'B'], ['n', 'N'], ['m', 'M'], ['ö', 'Ö'],
      ['ç', 'Ç'], ['.', ':'], ['/', '/'], ['✔', '✔']],
      [[' ', ' ']]
    ];
    this.numboard = [
      [[1], [2], [3]],
      [[4], [5], [6]],
      [[7], [8], [9]],
      [['.'], [0], ['◂']],
      [['✔']]
    ];
    this.keyboardInput = '';
    this.placeholder = '';
  }

  ngOnInit() {
    this.onAir = false;
    this.focusListener = this.renderer.listen('document', 'focusin', (event: FocusEvent) => {
      if (!this.keyboardStatus) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tagName = target.tagName ? target.tagName.toLowerCase() : '';
      if (tagName !== 'input' && tagName !== 'textarea') return;
      this.keyboardService.triggerKeyboard('Open', new ElementRef(target));
    });
    this.inputSub = this.keyboardService.listenInput().subscribe(element => {
      if (!element || !element.nativeElement) return;
      this.selectedInput = element;
      // this.selectedForm = element.nativeElement.form; // NativeElement might not have form property typed
      this.inputType = element.nativeElement.type;
      this.keyboardInput = element.nativeElement.value;
      this.placeholder = element.nativeElement.placeholder;
      switch (this.inputType) {
        case 'text':
          this.keytype = this.keyboard;
          this.onNumb = false;
          break;
        case 'number':
          this.keytype = this.numboard;
          this.onNumb = true;
          break;
        case 'password':
          this.keytype = this.numboard;
          this.onNumb = true;
          break;
        default:
          this.keytype = this.keyboard;
          this.onNumb = false;
          break;
      }
    });
    this.keyboardSub = this.keyboardService.listenKeyboard().subscribe(signal => {
      if (signal === 'Open') {
        this.onAir = true;
      } else if (signal === 'Close') {
        this.onAir = false;
      }
    });
  }

  ngOnDestroy(): void {
      if (this.settingsSub) this.settingsSub.unsubscribe();
      if (this.inputSub) this.inputSub.unsubscribe();
      if (this.keyboardSub) this.keyboardSub.unsubscribe();
      if (this.focusListener) this.focusListener();
  }

  pushKey(key: string) {
    if (!this.selectedInput || !this.selectedInput.nativeElement) return;
    
    switch (key) {
      case '▴':
        this.keyIndex = 1;
        break;
      case '▾':
        this.keyIndex = 0;
        break;
      case '◂':
        if (this.keyboardInput && this.keyboardInput.length > 0) {
            this.keyboardInput = this.keyboardInput.toString().slice(0, -1);
        }
        break;
      case '✔':
        this.closeKeyboard();
        break;
      default:
        // Handle number vs text
        if (this.inputType === 'number') {
          // this.selectedInput.nativeElement.type = 'text'; // Avoid changing type if possible
          this.keyboardInput = (this.keyboardInput || '') + key;
        } else {
          this.keyboardInput = (this.keyboardInput || '') + key;
        }
        break;
    }
    this.selectedInput.nativeElement.value = this.keyboardInput;
    this.selectedInput.nativeElement.dispatchEvent(new Event('keyup'));
    this.selectedInput.nativeElement.dispatchEvent(new Event('input'));
    this.selectedInput.nativeElement.dispatchEvent(new Event('keydown'));
  }

  closeKeyboard() {
    this.keyboardInput = '';
    this.keyIndex = 0;
    if (this.onNumb) {
        if (this.selectedInput && this.selectedInput.nativeElement) {
            this.selectedInput.nativeElement.type = 'number';
        }
    }
    this.keyboardService.triggerKeyboard('Close', this.selectedInput);
  }

}

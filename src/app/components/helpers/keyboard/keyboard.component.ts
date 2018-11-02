import { Component, ElementRef, OnInit, Renderer } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { KeyboardService } from '../../../providers/keyboard.service';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss'],
})

export class KeyboardComponent implements OnInit {
  keytype: Array<any>;
  keyboard: Array<any>;
  numboard: Array<any>;
  keyIndex: Number;
  signalListener: Subscription;
  selectedInput: ElementRef;
  selectedForm: NgForm;
  onAir: Boolean;
  onNumb: Boolean;
  keyboardInput: any;
  inputType: String;
  keyboardStatus: boolean;
  placeholder: string;

  constructor(private keyboardService: KeyboardService, private settings: SettingsService, private renderer: Renderer) {
    this.settings.AppSettings.subscribe(res => {
      if (res) {
        if (res.value.keyboard == 'Açık') {
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
      [["1", "!"], ["2", "@"], ["3", "#"], ["4", "$"], ["5", "%"], ["6", "\u00a8"], ["7", "&"], ["8", "*"], ["9", "("], ["0", ")"], ["*", "?"], ["-", "_"], ["◂", "◂"]],
      [["q", "Q"], ["w", "W"], ["e", "E"], ["r", "R"], ["t", "T"], ["y", "Y"], ["u", "U"], ["ı", "I"], ["o", "O"], ["p", "P"], ["ğ", "Ğ"], ["ü", "Ü"], ["▴", "▴"]],
      [["a", "A"], ["s", "S"], ["d", "D"], ["f", "F"], ["g", "G"], ["h", "H"], ["j", "J"], ["k", "K"], ["l", "L"], ["ş", "Ş"], ["i", "İ"], [",", ";"], ["▾", "▾"]],
      [["\\", "|"], ["z", "Z"], ["x", "X"], ["c", "C"], ["v", "V"], ["b", "B"], ["n", "N"], ["m", "M"], ["ö", "Ö"], ["ç", "Ç"], [".", ":"], ["/", "/"], ["✔", "✔"]],
      [[" ", " "]]
    ];
    this.numboard = [
      [[1], [2], [3]],
      [[4], [5], [6]],
      [[7], [8], [9]],
      [["."], [0], ["◂"]],
      [["✔"]]
    ];
    this.keyboardInput = "";
    this.placeholder = "";
  }

  ngOnInit() {
    this.onAir = false;
    this.keyboardService.listenInput().subscribe(element => {
      this.selectedInput = element;
      this.selectedForm = element.nativeElement.form;
      this.inputType = element.nativeElement.type;
      this.keyboardInput = element.nativeElement.value;
      this.placeholder = element.nativeElement.placeholder;
      switch (this.inputType) {
        case "text":
          this.keytype = this.keyboard;
          this.onNumb = false;
          break;
        case "number":
          this.keytype = this.numboard;
          this.onNumb = true;
          break;
        case "password":
          this.keytype = this.numboard;
          this.onNumb = true;
          break;
        default:
          this.keytype = this.keyboard;
          this.onNumb = false;
          break;
      }
    });
    this.keyboardService.listenKeyboard().subscribe(signal => {
      if (signal == "Open") {
        this.onAir = true;
        let dBody = document.getElementsByTagName("body");
      } else if (signal == "Close") {
        this.onAir = false;
      }
    });
  }

  pushKey(key: string) {
    switch (key) {
      case "▴":
        this.keyIndex = 1;
        break;
      case "▾":
        this.keyIndex = 0;
        break;
      case "◂":
        this.keyboardInput = this.keyboardInput.slice(0, -1);
        break;
      case "✔":
        this.closeKeyboard();
        break;
      default:
        if (this.inputType == "number") {
          this.selectedInput.nativeElement.type = "text";
          this.keyboardInput += key;
        } else {
          this.keyboardInput += key;
        }
        break;
    }
    this.selectedInput.nativeElement.value = this.keyboardInput;
    this.selectedInput.nativeElement.dispatchEvent(new Event('keyup'));
    this.selectedInput.nativeElement.dispatchEvent(new Event('input'));
    this.selectedInput.nativeElement.dispatchEvent(new Event('keydown'));
  }

  closeKeyboard() {
    this.keyboardInput = "";
    this.keyIndex = 0;
    if (this.onNumb) {
      this.selectedInput.nativeElement.type = 'number';
    }
    this.keyboardService.triggerKeyboard('Close', this.selectedInput);
  }

}

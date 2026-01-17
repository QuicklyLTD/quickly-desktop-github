import { Injectable, ElementRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class KeyboardService {
  signal = new Subject<any>();
  input = new Subject<ElementRef>();

  constructor() { }

  triggerKeyboard(command: string, element: ElementRef) {
    this.signal.next(command);
    this.input.next(element);
  }

  listenKeyboard(): Observable<any> {
    return this.signal.asObservable();
  }

  listenInput(): Observable<ElementRef> {
    return this.input.asObservable();
  }

  syncInputs(element: ElementRef) {
    this.input.next(element);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import swal from 'sweetalert';

@Injectable()
export class MessageService {
      private subject = new Subject<any>();

      sendMessage(message: string) {
            this.subject.next({ text: message });
            setTimeout(
                  () => {
                        this.subject.next();
                  }, 2000)
      }

      getMessage(): Observable<any> {
            return this.subject.asObservable();
      }

      sendAlert(header: string, message: string, type: string) {
            swal(header, message, type, { buttons: { confirm: { text: 'Tamam' } } });
      }

      sendConfirm(message: string) {
            return swal(message, { buttons: ["İptal", "Tamam"], });
      }
}

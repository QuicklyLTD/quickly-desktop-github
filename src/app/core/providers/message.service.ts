import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import swal from 'sweetalert';

@Injectable()
export class MessageService {
    private subject = new Subject<any>();

    sendMessage(message: string) {
        this.subject.next({ text: message });
        setTimeout(
            () => {
                this.subject.next(null);
            }, 2000);
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }

    sendAlert(header: string, message: string, type: string) {
        swal(header, message, type, {
            buttons: {
                confirm: {
                    text: 'Tamam',
                    value: true,
                    visible: true,
                    className: 'btn btn-lg btn-success',
                    closeModal: true
                }
            }
        });
    }

    sendConfirm(message: string) {
        return swal(message, {
            buttons: {
                cancel: {
                    text: 'İptal',
                    value: false,
                    visible: true,
                    className: 'btn btn-lg btn-danger',
                    closeModal: true
                },
                confirm: {
                    text: 'Tamam',
                    value: true,
                    visible: true,
                    className: 'btn btn-lg btn-success',
                    closeModal: true
                }
            }
        });
    }
}

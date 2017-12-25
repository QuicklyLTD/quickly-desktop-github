import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from '../../../providers/message.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
	selector: 'app-message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.scss']
})

export class MessageComponent implements OnInit, OnDestroy {
	subscription: Subscription;
	message: string;
	show: boolean;

	constructor(private messageService: MessageService) {
	}

	ngOnInit() {
		this.subscription = this.messageService.getMessage().subscribe((message) => {
			this.message = message;
		});
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

}

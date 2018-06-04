import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MessageService } from '../../../providers/message.service';

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

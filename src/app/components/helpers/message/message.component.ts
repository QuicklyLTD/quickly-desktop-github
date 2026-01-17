import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { Subscription } from 'rxjs';
import { MessageService } from '../../../core/providers/message.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})

export class MessageComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  message: any; // Changed from string to any to match service (object with text)
  show: boolean;

  constructor(private messageService: MessageService) {
  }

  ngOnInit() {
    this.subscription = this.messageService.getMessage().subscribe((message) => {
      this.message = message;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
        this.subscription.unsubscribe();
    }
  }

}

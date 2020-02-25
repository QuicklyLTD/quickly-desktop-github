import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsReportsComponent } from './notifications-reports.component';

describe('NotificationsReportsComponent', () => {
  let component: NotificationsReportsComponent;
  let fixture: ComponentFixture<NotificationsReportsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationsReportsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

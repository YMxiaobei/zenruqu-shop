import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {
  @Input() isSpinning = true;
  @Input() fullScreen = false;
  @Input() gitLoading = false;
  @Input() type = 'fullscreen';

  constructor() { }

  ngOnInit() {
  }

}

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import { TrainingService } from '../training.service';
import { StopTrainingComponent } from './stop-training.component';
import * as fromTrainig from '../training.reducer';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-current-training',
  templateUrl: './current-training.component.html',
  styleUrls: ['./current-training.component.css']
})
export class CurrentTrainingComponent implements OnInit {
  progress = 0;
  timer: number;

  constructor(
    private store: Store<fromTrainig.State>,
    private dialog: MatDialog,
    private trainingService: TrainingService) { }

  ngOnInit(): void {
    this.startOrResumeTimer();
  }

  startOrResumeTimer(): void {
    this.store.select(fromTrainig.getActiveTraining)
    .pipe(take(1))
    .subscribe(ex => {
      const step = ex.duration / 100 * 1000;
      this.timer = setInterval(() => {
        if (this.progress >= 100) {
          this.trainingService.completeExercise();
          this.stopTimer();
        } else {
          this.progress += 1;
        }
      }, step);
    });
  }

  onStop(): void {
    clearInterval(this.timer);
    const dialogRef = this.dialog.open(StopTrainingComponent, {
      data: {
        progress: this.progress
    }});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.trainingService.cancelExercise(this.progress);
      } else {
        this.startOrResumeTimer();
      }
    });
  }

  private stopTimer(): void {
    clearInterval(this.timer);
  }
}

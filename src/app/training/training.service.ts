import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { UIService } from '../shared/ui.service';
import { Exercise } from './exercise.model';
import * as fromRoot from '../app.reducer';
import * as fromTraining from './training.reducer';
import * as UI from '../shared/ui.actions';
import * as Training from './training.actions';

@Injectable()
export class TrainingService {
  private fbSubs: Subscription[] = [];

  constructor(
    private db: AngularFirestore,
    private uiService: UIService,
    private store: Store<{ui: fromTraining.State}>) {
      this.store.select(fromRoot.getIsAuth).subscribe(result => {
        if (!result) {
          console.log(result);
          this.cancelSubscriptions();
        }
      });
    }

  fetchAvailableExercises(): void {
    this.store.dispatch(new UI.StartLoading());
    this.fbSubs.push(this.db.collection('availableExercises')
      .snapshotChanges()
      .pipe(map(docArray => {
        return docArray.map(doc => {
          return {
            id: doc.payload.doc.id,
            ...doc.payload.doc.data() as Exercise
          };
        });
      }))
      .subscribe((exercises: Exercise[]) => {
        this.store.dispatch(new UI.StopLoading());
        this.store.dispatch(new Training.SetAvailableTrainings(exercises));
      }, _ => {
        this.store.dispatch(new UI.StopLoading());
        this.uiService.showSnackbar('Fetching Exercise failed, please try again later.', null, 3000);
      }));
  }

  startExercise(selectedId: string): void {
    this.store.dispatch(new Training.StartTraining(selectedId))
  }

  completeExercise(): void {
    this.store.select(fromTraining.getActiveTraining)
    .pipe(take(1))
    .subscribe(ex => {
      this.addDataToDatabase({...ex, date: new Date(), state: 'completed'});
      this.store.dispatch(new Training.StopTraining());
    });
  }

  cancelExercise(progress: number): void {
    this.store.select(fromTraining.getActiveTraining)
    .pipe(take(1))
    .subscribe(ex => {
      this.addDataToDatabase({
        ...ex,
        duration: ex.duration * (progress / 100),
        calories: ex.calories * (progress / 100),
        date: new Date(),
        state: 'cancelled'
      });
      this.store.dispatch(new Training.StopTraining());
    });
  }

  fetchCompletedOrCancelledExercises(): void {
    this.fbSubs.push(this.db.collection('finishedExercises').valueChanges()
      .subscribe((exercises: Exercise[]) => {
        this.store.dispatch(new Training.SetFinishedTrainings(exercises));
      }));
  }

  private addDataToDatabase(exercise: Exercise): void {
    this.db.collection('finishedExercises').add(exercise);
  }

  cancelSubscriptions(): void {
    this.fbSubs.forEach(sub => sub.unsubscribe());
  }
}

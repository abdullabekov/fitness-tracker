import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { TrainingComponent } from './training.component';

const routes: Route[] = [
    { path: '', component: TrainingComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrainingRoutingModule {}

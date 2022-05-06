import { OnInit, AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddTodoDialogComponent } from '../../components/add-todo-dialog/add-todo-dialog.component';
import { TodoService } from '../../services/todo.service';
import { Store, select } from '@ngrx/store';
import { CdkDragRelease, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormControl } from '@angular/forms';
import { getTasks, addTask, updateTask, deleteTask } from '../../actions/ToDoActions';
import { selectTasks, selectError } from '../../reducers/ToDoReducers';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})

export class HomePageComponent implements OnInit, AfterViewInit {
  allTasks: any = [];
  todo: any = [];
  done: any = [];
  myControl = new FormControl();
  filterName: string;

  items$: any;
  error$: any;

  lockAxis: any;
  @ViewChild('resizeBox') resizeBox: ElementRef;
  @ViewChild('dragHandleRight') dragHandleRight: ElementRef;
  @ViewChild('dragHandleBottom') dragHandleBottom: ElementRef;

  constructor(
    private ngZone: NgZone,
    public dialog: MatDialog,
    private store: Store<any>
  ) {
    this.store.dispatch(getTasks());
    this.items$ = this.store.pipe(select(selectTasks));
    this.error$ = this.store.pipe(select(selectError));

    store.pipe(select(selectTasks)).subscribe(allTasks => {
      this.allTasks = allTasks || [];
      this.todo = this.allTasks.filter(t => !t.done);
      this.done = this.allTasks.filter(t => t.done);
      this.todo.sort(this.dynamicSort('order', 'asc'));
      this.done.sort(this.dynamicSort('order', 'asc'));
    });
  }
  ngOnInit() {
    this.getTodos();
  }
  ngAfterViewInit() {
    this.setAllHandleTransform();
  }
  openAddTodoDialog() {
    const dialogRef = this.dialog.open(AddTodoDialogComponent, {
      width: '70vw',
      data: {}
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getTodos();
    });
  }
  getTodos() {
    this.store.dispatch(getTasks());
  }

  drop(event: CdkDragDrop<any[]>) {
    let copyOfPrevious: any;
    let isSwapped: boolean;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      isSwapped = false;
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

      const previousOriginal = event.previousContainer.data;

      copyOfPrevious = previousOriginal.map(obj => {
        const rObj: any = {};
        rObj.done = obj.done;
        rObj.description = obj.description;
        rObj.id = obj.id;
        rObj.order = obj.order;
        return rObj;
      });
      copyOfPrevious.forEach((x, index) => {
        x.order = index;
      });

      isSwapped = true;
    }

    const original = event.container.data;

    const toggleOfCopy = event.item.data;
    const taskToToggle = { ...toggleOfCopy };

    if (isSwapped) {
      taskToToggle.done = !taskToToggle.done;
    } else {
      taskToToggle.done = taskToToggle.done;
    }

    const copyOfOriginal = original.map(obj => {
      const rObj: any = {};
      rObj.done = obj.done;
      rObj.description = obj.description;
      rObj.id = obj.id;
      rObj.order = obj.order;
      return rObj;
    });

    copyOfOriginal.forEach((x, index) => {
      x.order = index;
    });

    let consolidatedList;
    if (copyOfPrevious) {
      consolidatedList = copyOfOriginal.concat(copyOfPrevious);
    } else {
      consolidatedList = copyOfOriginal;
    }

    this.store.dispatch(updateTask({
      toggle: taskToToggle,
      tasks: consolidatedList
    }));
  }

  removeTodo(index: number, tasks: any[]) {
    this.store.dispatch(deleteTask({ task: tasks[index] }));
  }

  get resizeBoxElement(): HTMLElement {
    return this.resizeBox.nativeElement;
  }

  get dragHandleRightElement(): HTMLElement {
    return this.dragHandleRight.nativeElement;
  }

  get dragHandleBottomElement(): HTMLElement {
    return this.dragHandleBottom.nativeElement;
  }

  setAllHandleTransform() {
    const rect = this.resizeBoxElement.getBoundingClientRect();
  }

  setHandleTransform(
    dragHandle: HTMLElement,
    targetRect: ClientRect | DOMRect,
    position: 'x' | 'y' | 'lockAxis'
  ) {
    const dragRect = dragHandle.getBoundingClientRect();
    const translateX = targetRect.width - dragRect.width;
    const translateY = targetRect.height - dragRect.height;

    if (position === 'x') {
      dragHandle.style.transform = `translate3d(${translateX}px, 0, 0)`;
    }

    if (position === 'y') {
      dragHandle.style.transform = `translate3d(0, ${translateY}px, 0)`;
    }

    if (position === 'lockAxis') {
      dragHandle.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    }
  }

  dragMove(dragHandle: HTMLElement) {
    this.ngZone.runOutsideAngular(() => {
      this.resize(dragHandle, this.resizeBoxElement);
    });
  }

  resize(dragHandle: HTMLElement, target: HTMLElement) {
    const dragRect = dragHandle.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const width = dragRect.left - targetRect.left + dragRect.width;
    const height = dragRect.top - targetRect.top + dragRect.height;

    target.style.width = width + 'px';
    target.style.height = height + 'px';

    this.setAllHandleTransform();
  }

  dynamicSort(property: string, order: string) {
    let sortOrder = 1;
    if (order === 'desc') {
      sortOrder = -1;
    }
    return (a, b) => {
      if (a[property] < b[property]) {
        return -1 * sortOrder;
      } else if (a[property] > b[property]) {
        return 1 * sortOrder;
      } else {
        return 0 * sortOrder;
      }
    };
  }
}

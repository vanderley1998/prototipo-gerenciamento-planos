import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray, CdkDrag, CdkDropList, transferArrayItem } from '@angular/cdk/drag-drop';
import { ResponsavelService } from 'src/app/service/responsavel.service';
import { Responsavel } from '../../core/responsavel';
import { Plano } from '../../core/plano';
import { PlanosService } from 'src/app/service/planos.service';
import { EventosService } from 'src/app/service/eventos.service';
import { Subscription } from 'rxjs';
import { OrdenacaoPlanosService } from 'src/app/service/ordenacao-planos.service';
import { UtilService } from 'src/app/service/util.service';

@Component({
  selector: 'app-item-lista',
  templateUrl: './item-lista.component.html',
  styleUrls: ['./item-lista.component.css']
})
export class ItemListaComponent implements OnInit, OnDestroy {

  @Input() value: Plano;
  @Input() connectedLists: string[];
  @Input() desabilitarSubPlano = false;
  responsavel: Responsavel;

  subPlanos: Plano[];

  dataInicio: Date;
  dataTermino: Date;

  inscriAtualizarLista: Subscription;

  constructor(
    private responsaveisService: ResponsavelService,
    private planosService: PlanosService,
    private eventosService: EventosService,
    private utilService: UtilService
  ) { }

  ngOnInit() {
    this.onGetResponsavel();
    this.getSubplanos();
    this.setPeriodo();
    this.inscricaoAtualizarLista();
    this.corrigirListaSubPlanos();
  }

  ngOnDestroy() {
    if (this.inscriAtualizarLista) { this.inscriAtualizarLista.unsubscribe(); }
  }

  inscricaoAtualizarLista(): void {
    this.inscriAtualizarLista = this.eventosService.emitirAtualizarListaPlanos.subscribe(() => {
      this.getSubplanos();
    });
  }

  corrigirListaSubPlanos(): void {
    this.subPlanos = this.subPlanos.filter(p => p !== undefined);
  }

  setPeriodo(): void {
    if (this.value.dataInicio) {
      const timestampInicio = Date.parse(this.value.dataInicio);
      this.dataInicio = new Date(timestampInicio);
    }

    if (this.value.dataTermino) {
      const timestampTermino = Date.parse(this.value.dataTermino);
      this.dataTermino = new Date(timestampTermino);
    }
  }

  setSemaforo(): object {
    if (this.dataInicio && this.value.statusAndamento !== 2) {
      if (new Date().getDate() === this.dataInicio.getDate()) { return { borderLeft: 'rgba(255, 166, 0, 0.5) 5px solid' }; }
      if (this.dataInicio > new Date()) { return { borderLeft: 'rgba(0, 128, 0, 0.5) 5px solid' }; }
      if (this.dataInicio < new Date()) { return { borderLeft: 'rgba(255, 0, 0, 0.5) 5px solid' }; }
    }
    return { borderLeft: '#CCC 5px solid' };
  }

  drop(event: CdkDragDrop<string[]>) {
    if (confirm('Deseja realmente mudar o sub-plano de possição?')) {
      if (event.previousContainer === event.container) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        this.ordenarSubPlanos();
      } else {
        const velhaListaSubPlanos = this.subPlanos.filter(p => p !== undefined && +p.pertence === this.value.id);
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        const novaListaSubPlanos = this.subPlanos.filter(p => p !== undefined);
        let plano: Plano;
        novaListaSubPlanos.forEach(p => {
          if (velhaListaSubPlanos.indexOf(p) === -1) { plano = p; }
        });
        plano.pertence = this.value.id;
        this.editarPertenceSubPlano(plano);
      }
    }
  }

  editarPertenceSubPlano(subPlano2: Plano): void {
    let subPlano: Plano;
    if (!subPlano2) {
      this.subPlanos.forEach(p => {
        if (p !== undefined && p.pertence === null) {
          p.pertence = this.value.id;
          subPlano = p;
        }
      });
    } else { subPlano = subPlano2; }
    this.eventosService.emitirBarraCarregamento.emit(true);
    this.planosService.salvarPlano(subPlano)
      .subscribe(resp => {
        this.eventosService.emitirBarraCarregamento.emit(true);
        this.ordenarSubPlanos();
      });
  }

  ordenarSubPlanos(): void {
    this.eventosService.emitirBarraCarregamento.emit(true);
    const ids: number[] = [];
    this.subPlanos.forEach((p: any) => {
      if (p !== undefined) {
        ids.push(p.id);
      }
    });
    const planoTemp: Plano = { ...this.value, ordemSubPlanos: ids };
    this.planosService.salvarPlano(planoTemp)
      .subscribe(resp => {
        this.value = planoTemp;
        this.eventosService.emitirBarraCarregamento.emit(false);
        this.utilService.abrirSnackBar('Lista de sub-planos reordenada com sucesso', 2000);
        this.corrigirListaSubPlanos();
      });
  }

  pointInsideOf(position: any, rect: DOMRect | ClientRect) {
    return position.x >= rect.left &&
      position.x <= rect.right &&
      position.y >= rect.top &&
      position.y <= rect.bottom;
  }

  getSubplanos(): void {
    let subPlanosTemp = this.planosService.listaPlanos.filter(p => p.pertence === this.value.id);
    const listaOrdenada: Plano[] = [];
    this.value.ordemSubPlanos.forEach(
      (ordem: number) => {
        listaOrdenada.push(subPlanosTemp.filter(p => p.id === ordem)[0]);
        subPlanosTemp = subPlanosTemp.filter(p => p.id !== ordem);
      }
    );
    subPlanosTemp.forEach(p => listaOrdenada.push(p));
    this.subPlanos = listaOrdenada;
  }

  onErrorAvatar(avatarImg: any): void {
    avatarImg.src = '../../../assets/img/baseline-account_circle-24px.svg';
  }

  onEditarPlano(): void {
    this.eventosService.emitirEditarPlano.emit(this.value);
  }

  atualizarListaLocal(plano: Plano, remover: boolean = false): void {
    if (remover) {
      this.planosService.listaPlanos = this.planosService.listaPlanos.filter(p => p.id !== plano.id);
    } else {
      this.planosService.listaPlanos = this.planosService.listaPlanos.map(p => {
        if (p.id === +plano.id) { p = { ...plano }; }
        return p;
      });
    }
  }

  onAlterarStatusPlano(status: number): void {
    if (status >= 1 && status <= 4) {
      const plano = this.value;
      plano.statusAndamento = status;
      this.eventosService.emitirBarraCarregamento.emit(true);
      this.planosService.salvarPlano(plano).subscribe(resp => {
        this.atualizarListaLocal(plano);
        this.eventosService.emitirBarraCarregamento.emit(false);
        this.eventosService.emitirAtualizarListaPlanos.emit();
      });
    }
  }

  onRemoverPlano(): void {
    if (confirm('Deseja realmente excluir este plano?')) {
      this.eventosService.emitirBarraCarregamento.emit(true);
      this.planosService.listaPlanos.forEach(p => {
        if (p.id === this.value.id) {
          this.planosService.deletarPlano(p).subscribe(resp => {
            this.atualizarListaLocal(p, true);
            this.eventosService.emitirBarraCarregamento.emit(false);
            this.eventosService.emitirAtualizarListaPlanos.emit();
          });
        }
      });
    }
  }

  onGetResponsavel(): void {
    if (this.responsaveisService.listaResponsaveis !== undefined
      && this.responsaveisService.listaResponsaveis.length > 0) {
      this.responsaveisService.listaResponsaveis.forEach(r => {
        if (r.id === +this.value.responsavel) {
          this.responsavel = r;
          return;
        }
      });
    } else {
      this.responsaveisService.getResponsavel(+this.value.responsavel)
        .subscribe(r => { this.responsavel = r; });
    }
  }

}

import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { ResponsavelService } from 'src/app/service/responsavel.service';
import { TiposPlanoService } from 'src/app/service/tipos-plano.service';
import { PlanosService } from 'src/app/service/planos.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatButton, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Plano } from '../../core/plano';
import { UtilService } from 'src/app/service/util.service';
import { OrdenacaoPlanosService } from 'src/app/service/ordenacao-planos.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-criar-plano',
  templateUrl: './criar-plano.component.html',
  styleUrls: ['./criar-plano.component.css']
})
export class CriarPlanoComponent implements OnInit {

  labelDialogPlano = 'CADASTRAR PLANO';

  listaPlanos: Plano[];

  dataInicio: Date;
  dataTermino: Date;

  formulario: FormGroup;
  @ViewChild('btnSalvarPlano') btnSalvarPlano: MatButton;

  statusBarraCarregamento: boolean;
  errosRequisicoes: boolean[] = [false, false, false];

  constructor(
    private tiposPlanoService: TiposPlanoService,
    private responsavelService: ResponsavelService,
    private planosService: PlanosService,
    private formBuilder: FormBuilder,
    private utilService: UtilService,
    private dialogRef: MatDialogRef<CriarPlanoComponent>,
    private ordenacaoPlanosService: OrdenacaoPlanosService,
    @Inject(MAT_DIALOG_DATA) private editarResgistro: Plano
  ) { }

  ngOnInit() {
    this.formReactivo();
    this.getTiposPlanoFromServer();
    this.getResponsaveisFromServer();
    this.getPlanosFromServer();
    this.listaPlanosFiltrado();
    this.verificarModo();
  }

  formReactivo(): void {
    this.formulario = this.formBuilder.group({
      id: [null],
      titulo: [null, [Validators.required]],
      tipo: [{ value: null, disabled: true }, [Validators.required]],
      responsavel: [{ value: null, disabled: true }, [Validators.required]],
      dataInicio: [{ value: null, disabled: false }],
      dataTermino: [{ value: null, disabled: false }],
      pertence: [{ value: {} }],
      interessados: [{ value: null, disabled: true }],
      custo: [null],
      descricao: [null]
    });
  }

  erroRequisicao(error: HttpErrorResponse): void {
    if (error.url.includes('/tipos')) { this.errosRequisicoes[0] = true; }
    if (error.url.includes('/planos')) { this.errosRequisicoes[1] = true; }
    if (error.url.includes('/responsaveis')) { this.errosRequisicoes[2] = true; }
  }

  verificarModo(): void {
    if (this.editarResgistro) {
      this.dataInicio = new Date(this.editarResgistro.dataInicio);
      this.dataTermino = new Date(this.editarResgistro.dataTermino);
      this.onModoEditar(this.editarResgistro);
    }
  }

  listaPlanosFiltrado(): void {
    if (this.planosService.listaPlanos) {
      this.listaPlanos = this.planosService.listaPlanos.filter(p => p.pertence === null);
    }
  }

  onFecharModal(): void {
    if (this.formulario.touched) {
      if (confirm('Deseja realmente sair?')) {
        this.dialogRef.close(true);
      }
    } else {
      this.dialogRef.close(true);
    }
  }

  onSalvarPlano(): void {
    if (this.formulario.valid) {
      this.corrigirCampoPertencer();
      const plano = this.montarObjetoPlano();
      this.toggleBarraCarregamento();
      this.toggleBloquearFormulario();
      this.planosService.salvarPlano(plano)
        .subscribe(resp => {
          if (!plano.id) { this.getPlanosFromServer(); }
          this.corrigirOrdenacao(plano);
          if (plano.id) { this.atualizarListaLocal(plano); }
          this.utilService.abrirSnackBar(`Plano salvo com sucesso!`, 2000);
          this.dialogRef.close(plano.id);
        }
        );
    } else { this.mostrarCamposInvalidos(); }
  }

  montarObjetoPlano(): Plano {
    let plano: Plano = {
      ...this.formulario.value,
      dataInicio: this.extrairData(this.formulario.get('dataInicio').value),
      dataTermino: this.extrairData(this.formulario.get('dataTermino').value),
      statusAndamento: this.editarResgistro.statusAndamento,
      ordemSubPlanos: this.editarResgistro.ordemSubPlanos
    };
    if (!plano.id) { plano = { ...plano, statusAndamento: null, ordemSubPlanos: [] }; }
    return plano;
  }

  corrigirCampoPertencer(): void {
    if (
      typeof this.formulario.get('pertence').value === 'object'
      || this.formulario.get('pertence').value === 'null'
    ) {
      this.formulario.get('pertence').setValue(null);
    }
  }

  corrigirOrdenacao(plano: Plano): void {
    if (plano.id && (plano.pertence !== this.editarResgistro.pertence)) {
      switch (this.editarResgistro.pertence) {
        case null:
          this.reordenarListaServidor(plano);
          break;
        default:
          this.planosService.listaPlanos.forEach(p => {
            if (p.id === +this.editarResgistro.pertence) {
              p.ordemSubPlanos = p.ordemSubPlanos.filter(o => o !== plano.id);
              this.planosService.salvarPlano(p).subscribe()
              return;
            }
          });
      }
    }
  }

  reordenarListaServidor(plano: Plano): void {
    this.ordenacaoPlanosService.listaOrdenacao.planos
      = this.ordenacaoPlanosService.listaOrdenacao.planos
        .filter(o => o !== plano.id);
    this.ordenacaoPlanosService.ordenarPlanos(this.ordenacaoPlanosService.listaOrdenacao)
      .subscribe();
  }

  mostrarCamposInvalidos(): void {
    Object.keys(this.formulario.controls).forEach(c => this.formulario.get(c).markAsTouched());
    this.utilService.abrirSnackBar(`Existem campos que requerem atenção!`, 2000);
  }

  extrairData(data: any): string {
    if (data) {
      const timestamp = Date.parse(data);
      const dia = new Date(timestamp).getDate();
      const mes = new Date(timestamp).getMonth() + 1;
      const ano = new Date(timestamp).getFullYear();
      return `${ano}-${mes}-${dia}`;
    }
    return null;
  }

  getTiposPlanoFromServer(): void {
    this.tiposPlanoService.getTiposPlano().subscribe(
      (tiposPlano) => {
        this.tiposPlanoService.listaTipos = tiposPlano;
        this.formulario.get('tipo').enable();
      },
      this.erroRequisicao.bind(this)
    );
  }

  getResponsaveisFromServer(): void {
    this.responsavelService.getResponsaveis().subscribe(
      (responsaveis) => {
        this.responsavelService.listaResponsaveis = responsaveis;
        this.formulario.get('responsavel').enable();
        this.formulario.get('interessados').enable();
      },
      this.erroRequisicao.bind(this)
    );
  }

  getPlanosFromServer(): void {
    if (this.planosService.listaPlanos === undefined || this.planosService.listaPlanos.length === 0) {
      this.planosService.getPlanos().subscribe(
        (planos) => {
          this.planosService.listaPlanos = planos;
          this.listaPlanosFiltrado();
        },
        this.erroRequisicao.bind(this)
      );
      this.formulario.get('pertence').enable();
    }
  }

  toggleBloquearFormulario(): void {
    if (this.formulario.enabled) {
      this.formulario.disable();
      this.btnSalvarPlano.disabled = true;
    } else {
      this.formulario.enable();
      this.formulario.reset();
      this.btnSalvarPlano.disabled = false;
    }
  }

  toggleBarraCarregamento(): void {
    this.statusBarraCarregamento = !this.statusBarraCarregamento;
  }

  atualizarListaLocal(plano: Plano): void {
    this.planosService.listaPlanos = this.planosService.listaPlanos.map(p => {
      if (p.id === +plano.id) { p = { ...plano }; }
      return p;
    });
  }

  setPeriodo(plano: Plano): void {
    if (plano.dataInicio) {
      const timestampInicio = Date.parse(plano.dataInicio);
      this.dataInicio = new Date(timestampInicio);
      this.formulario.get('dataInicio').setValue(this.dataInicio);
    } else { this.dataInicio = null; }

    if (plano.dataTermino) {
      const timestampTermino = Date.parse(plano.dataTermino);
      this.dataTermino = new Date(timestampTermino);
      this.formulario.get('dataTermino').setValue(this.dataTermino);
    } else { this.dataTermino = null; }
  }

  onModoEditar(plano: Plano): void {
    this.labelDialogPlano = 'EDITAR PLANO';
    this.formulario.patchValue(plano);
    this.setPeriodo(plano);
    if (this.listaPlanos) {
      this.listaPlanos = this.listaPlanos.filter(p => p.id !== plano.id);
    }
  }

  onModoOriginal(): void {
    this.labelDialogPlano = 'CADASTRAR PLANO';
    this.formulario.reset();
  }

  onDesativarBtnSalvar(): boolean {
    return this.responsavelService.listaResponsaveis === undefined
      && this.tiposPlanoService.listaTipos === undefined;
  }

}

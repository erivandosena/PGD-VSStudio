import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import { IDominio } from '../../../../../../shared/models/dominio.model';
import { DominioDataService } from '../../../../../../shared/services/dominio.service';
import { IPactoTrabalho, IPactoTrabalhoAtividade, IAvaliacaoAtividade } from '../../../../models/pacto-trabalho.model';
import { PactoTrabalhoDataService } from '../../../../services/pacto-trabalho.service';
import { PerfilEnum } from '../../../../enums/perfil.enum';
import { DecimalValuesHelper } from '../../../../../../shared/helpers/decimal-valuesr.helper';

@Component({
  selector: 'pacto-lista-atividade-andamento',
  templateUrl: './atividade-andamento.component.html',
})
export class PactoListaAtividadeAndamentoComponent implements OnInit {

  PerfilEnum = PerfilEnum;

  @Input() dadosPacto: BehaviorSubject<IPactoTrabalho>;
  servidor = new BehaviorSubject<number>(null);

  @Input() readOnly: Boolean;
  @Input() isReadOnly = new BehaviorSubject<Boolean>(true);

  @ViewChild('modalCadastro', { static: true }) modalCadastro;
  @ViewChild('modalAvaliacao', { static: true }) modalAvaliacao;
  @ViewChild('modalConsideracoes', { static: true }) modalConsideracoes;

  form: FormGroup;
  formAvaliacao: FormGroup;
  formConsideracoes: FormGroup;

  atividadeEdicao: IPactoTrabalhoAtividade = { quantidade: 1 };
  situacoes: IDominio[];

  atividadeAvaliacao: IPactoTrabalhoAtividade;

  situacaoId: number;
  situacaoIdDetalhes: number;

  tempoPrevistoTotal = 0;
  tempoRealizado = 0;
  tempoHomologado = 0;

  dentroPrazoAvaliacao: boolean;

  public tempoMask: any;
  minDataInicio: any;
  maxDataInicio: any;
  minDataConclusao: any;
  maxDataConclusao: any;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private decimalValuesHelper: DecimalValuesHelper,
    private pactoTrabalhoDataService: PactoTrabalhoDataService,
    private dominioDataService: DominioDataService) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      situacaoId: [null, [Validators.required]],
      dataInicio: [null, []],
      dataFim: [null, []],
      tempoRealizado: [null, []],
      descricao: ['', []],
      consideracoes: ['', [Validators.maxLength(2000)]],
    });

    this.formAvaliacao = this.formBuilder.group({
      avaliacao: [null, []],
      justificativa: ['', [
        this.validarJustificativaSeAvaliacaoInferiorA(5)
      ]]
    });

    this.formConsideracoes = this.formBuilder.group({
      descricao: [null, []],
      consideracoes: ['', []]
    });

    this.tempoMask = this.decimalValuesHelper.numberMask(3, 1);

    this.dadosPacto.subscribe(val => this.carregarAtividades());

    this.dominioDataService.ObterSituacaoAtividadePactoTrabalho().subscribe(
      appResult => {
        this.situacoes = appResult.retorno;
      }
    );
  }

  fillForm() {
    this.form.patchValue({
      situacaoId: this.atividadeEdicao.situacaoId,
      dataInicio: this.atividadeEdicao.dataInicio,
      dataFim: this.atividadeEdicao.dataFim,
      tempoRealizado: this.atividadeEdicao.tempoRealizado,
      descricao: this.atividadeEdicao.descricao,
      consideracoes: this.atividadeEdicao.consideracoes,
    });
    this.situacaoId = this.atividadeEdicao.situacaoId; 
    this.form.controls['descricao'].disable();
  }

  carregarAtividades() {
    const timeDiff = Math.abs(new Date(this.dadosPacto.value.dataFim).getTime() - new Date().getTime());
    const tempoEncerramentoPacto = Math.ceil(timeDiff / (1000 * 3600 * 24));

    this.dentroPrazoAvaliacao = this.dadosPacto.value.situacaoId === 405 || tempoEncerramentoPacto <= 40;

    this.servidor.next(this.dadosPacto.value.pessoaId);
    this.isReadOnly.next(this.readOnly || this.dadosPacto.value.situacaoId !== 405);
    this.pactoTrabalhoDataService.ObterAtividades(this.dadosPacto.value.pactoTrabalhoId).subscribe(
      resultado => {
        this.dadosPacto.value.atividades = resultado.retorno;
        this.tempoPrevistoTotal = this.dadosPacto.value.atividades.reduce((a, b) => a + b.tempoPrevistoTotal, 0);
        this.tempoRealizado = this.dadosPacto.value.atividades.reduce((a, b) => a + b.tempoRealizado, 0);
        this.tempoHomologado = this.dadosPacto.value.atividades.reduce((a, b) => a + b.tempoHomologado, 0);
      }
    );

    this.minDataInicio = this.formatarData(new Date(this.dadosPacto.value.dataInicio));
    this.maxDataInicio = this.formatarData(new Date());

    this.minDataConclusao = this.formatarData(new Date(this.getDataInicio()));
    this.maxDataConclusao = this.formatarData(new Date());
      
  }

  editar(pactoTrabalhoAtividadeId: string) {
    this.atividadeEdicao = this.dadosPacto.value.atividades.filter(a => a.pactoTrabalhoAtividadeId === pactoTrabalhoAtividadeId)[0];
    this.abrirTelaCadastro();
    this.mudarSituacao(this.atividadeEdicao.situacaoId);
    this.fillForm();
  }

  exibirDetalhes(pactoTrabalhoAtividadeId: string) {
    const atividade = this.dadosPacto.value.atividades.filter(a => a.pactoTrabalhoAtividadeId === pactoTrabalhoAtividadeId)[0];
    this.formConsideracoes.patchValue({
      descricao: atividade.descricao,
      consideracoes: atividade.consideracoes
    });
    this.formConsideracoes.disable();
    this.situacaoIdDetalhes = atividade.situacaoId; 
    this.modalService.open(this.modalConsideracoes, { size: 'sm' });
  }

  editarAtividade() {
    if (this.form.valid) {
      const dados: IPactoTrabalhoAtividade = this.form.value;
      dados.pactoTrabalhoId = this.dadosPacto.value.pactoTrabalhoId;
      dados.pactoTrabalhoAtividadeId = this.atividadeEdicao.pactoTrabalhoAtividadeId;
      dados.dataInicio = this.form.get('dataInicio').value;
      dados.dataFim = this.form.get('dataFim').value;
      dados.consideracoes = this.form.get('consideracoes').value;
      this.pactoTrabalhoDataService.AlterarAndamentoAtividade(dados).subscribe(
        r => {
          if (r.retorno) {
            this.carregarAtividades();
            this.fecharModal();
          }
        });
    }
    else {
      this.getFormValidationErrors(this.form)
    }
  }

  getFormValidationErrors(form) {
    Object.keys(form.controls).forEach(field => {
      const control = form.get(field);
      control.markAsDirty({ onlySelf: true });
    });
  }

  mudarSituacao(value) {
    this.situacaoId = value;
    if (+value === 501) {
      this.form.get('dataInicio').setValue(null);
      this.form.get('dataInicio').clearValidators();
      this.form.get('dataFim').setValue(null);
      this.form.get('dataFim').clearValidators();
      this.form.get('tempoRealizado').setValue(null);
      this.form.get('tempoRealizado').clearValidators(); 
      this.form.get('consideracoes').setValue(null);
      this.form.get('consideracoes').clearValidators();
    }
    else if (+value === 502) {
      this.form.get('dataInicio').setValidators(Validators.required);
      this.form.get('dataFim').setValue(null);
      this.form.get('dataFim').clearValidators();
      this.form.get('tempoRealizado').setValue(null);
      this.form.get('tempoRealizado').clearValidators();
      this.form.get('consideracoes').clearValidators();
    }                 
    else {
      this.form.get('dataInicio').setValidators(Validators.required);
      this.form.get('dataFim').setValidators(Validators.required);
      this.form.get('tempoRealizado').setValidators(Validators.required);
      this.form.get('consideracoes').setValidators(Validators.required);
    }
    this.form.get('dataInicio').updateValueAndValidity();
    this.form.get('dataFim').updateValueAndValidity();
    this.form.get('tempoRealizado').updateValueAndValidity();
    this.form.get('consideracoes').updateValueAndValidity();
  }

  getDataInicio() {
    if (this.form.get('dataInicio').value)
      return this.form.get('dataInicio').value;
    return this.dadosPacto.value.dataInicio;
  }

  alterarDataInicio() {
    const dataInicio = new Date(this.getDataInicio());    
    this.minDataConclusao = this.formatarData(dataInicio);

    if (this.form.get('dataFim').value) {
      const dataFim = new Date(this.form.get('dataFim').value);
      if (dataFim < dataInicio)
        this.form.get('dataFim').setValue(null);
    }    
  }

  avaliar(pactoTrabalhoAtividadeId: string) {
    this.atividadeAvaliacao = this.dadosPacto.value.atividades.filter(a => a.pactoTrabalhoAtividadeId === pactoTrabalhoAtividadeId)[0];
    this.abrirTelaAvaliacao();

    if (this.atividadeAvaliacao.nota) {
      this.formAvaliacao.patchValue({
        avaliacao: this.atividadeAvaliacao.nota,
        justificativa: this.atividadeAvaliacao.justificativa
      })
    }
    else {
      this.formAvaliacao.reset();
    }
  }

  salvarAvaliacao() {
    if (this.formAvaliacao.valid) {
      const dadosForm = this.formAvaliacao.value;
      const dados: IAvaliacaoAtividade = {
        nota: dadosForm.avaliacao,
        justificativa: dadosForm.justificativa
      };
      this.pactoTrabalhoDataService.AvaliarAtividade(this.atividadeAvaliacao.pactoTrabalhoId, this.atividadeAvaliacao.pactoTrabalhoAtividadeId, dados).subscribe(
        appResult => {
          this.carregarAtividades();
          this.fecharModal();
        });
    }
  }

  private validarJustificativaSeAvaliacaoInferiorA(avaliacaoMinima: number) {

    let justificativaControl: FormControl;
    let avaliacaoControl: FormControl;

    return (control: FormControl) => {
      if (!control.parent) return null;

      if (!justificativaControl) {
        justificativaControl = control;
        avaliacaoControl = control.parent.get('avaliacao') as FormControl;
        avaliacaoControl.valueChanges.subscribe(() => {
          justificativaControl.updateValueAndValidity();
        });
      }

      const avaliacao: number = avaliacaoControl.value;
      const justificativa: string = justificativaControl.value;

      const avaliacaoNula = avaliacao !== 0 && !avaliacao;
      const avaliacaoMenorQueMinimoEJustificativaNaoPreenchida = avaliacao < avaliacaoMinima && (!justificativa || justificativa.length < 5);
      if (avaliacaoNula || avaliacaoMenorQueMinimoEJustificativaNaoPreenchida)
        return { required: true };

      return null;
    };

  }

  formatarData(data: Date) {
    return {
      'year': data.getFullYear(),
      'month': data.getMonth() + 1,
      'day': data.getDate()
    };
  }

  abrirTelaCadastro() {
    this.fillForm();
    this.modalService.open(this.modalCadastro, { size: 'sm' });
  }

  abrirTelaAvaliacao() {
    this.modalService.open(this.modalAvaliacao, { size: 'sm' });
  }

  fecharModal() {
    this.atividadeEdicao = {};
    this.modalService.dismissAll();
  }
}

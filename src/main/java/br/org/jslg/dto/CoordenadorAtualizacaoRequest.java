package br.org.jslg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CoordenadorAtualizacaoRequest(
        @NotBlank @Size(max = 80) String usuario,
        @Size(min = 12, max = 72) String senha) { }

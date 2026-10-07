package br.org.jslg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CoordenadorRequest(
        @NotBlank @Size(max = 80) String usuario,
        @NotBlank @Size(min = 12, max = 72) String senha) { }

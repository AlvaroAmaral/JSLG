package br.org.jslg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record EventoRequest(
        @NotBlank @Size(max = 150) String titulo,
        @NotNull LocalDateTime dataHora,
        @NotBlank @Size(max = 200) String local,
        @Size(max = 2000) String descricao,
        @Size(max = 1_400_000) String arte) { }

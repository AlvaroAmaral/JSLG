package br.org.jslg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MembroRequest(
        @NotBlank(message = "Informe o nome completo.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.") String nome,
        @Size(max = 31, message = "O usuário do Instagram deve ter no máximo 30 caracteres, além do @ opcional.")
        @Pattern(regexp = "^(?:\\s*|@?[A-Za-z0-9._]{1,30})$", message = "O Instagram não aceita acentos. Use letras sem acento, números, ponto ou sublinhado.") String instagram,
        @Size(max = 20, message = "O telefone deve ter no máximo 20 caracteres.") String telefone) { }

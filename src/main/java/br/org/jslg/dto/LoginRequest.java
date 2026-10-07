package br.org.jslg.dto;
import jakarta.validation.constraints.NotBlank;
public record LoginRequest(@NotBlank String usuario, @NotBlank String senha) { }

package br.org.jslg.dto;
import jakarta.validation.constraints.NotNull;
public record PresencaRequest(@NotNull Long membroId) { }

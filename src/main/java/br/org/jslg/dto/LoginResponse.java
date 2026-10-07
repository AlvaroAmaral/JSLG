package br.org.jslg.dto;
import java.time.Instant;
public record LoginResponse(String token, String tipo, Instant expiraEm, String usuario, String papel) { }

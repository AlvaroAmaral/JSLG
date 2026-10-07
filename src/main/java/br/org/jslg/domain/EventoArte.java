package br.org.jslg.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "evento_arte")
public class EventoArte {
    @Id
    @Column(name = "evento_id")
    private Long eventoId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "evento_id")
    private Evento evento;

    @Column(name = "mime_type", nullable = false, length = 40)
    private String mimeType;

    @Column(name = "dados", nullable = false, columnDefinition = "BYTEA")
    private byte[] dados;

    public EventoArte() { }
    public EventoArte(Evento evento, String mimeType, byte[] dados) {
        this.evento = evento;
        this.mimeType = mimeType;
        this.dados = dados;
    }
    public Long getEventoId() { return eventoId; }
    public Evento getEvento() { return evento; }
    public String getMimeType() { return mimeType; }
    public byte[] getDados() { return dados; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public void setDados(byte[] dados) { this.dados = dados; }
}

import Reveal from "@/components/Reveal";

const DOTA_CLASSES = [
  "Plane", "Ship", "Storage Tank", "Baseball Diamond", "Tennis Court",
  "Basketball Court", "Ground Track Field", "Harbor", "Bridge",
  "Large Vehicle", "Small Vehicle", "Helicopter", "Roundabout",
  "Soccer Ball Field", "Swimming Pool",
];

const HRSC_CLASSES = [
  "Aircraft Carrier", "Warcraft", "Merchant Ship", "Cruiser", "Submarine",
  "Container Ship", "Tanker", "Fishing Boat", "Passenger Ship", "Yacht",
  "Speedboat", "Sailboat", "Barge", "Ferry", "Cargo Ship", "Tugboat",
];

const FAIR1M_VEHICLES = [
  { name: "Small Car", count: 32887 },
  { name: "Van", count: 8940 },
  { name: "Bus", count: 3120 },
  { name: "Cargo Truck", count: 2410 },
  { name: "Dump Truck", count: 1980 },
  { name: "Trailer", count: 950 },
  { name: "Other Vehicle", count: 640 },
  { name: "Truck Tractor", count: 310 },
  { name: "Excavator", count: 210 },
  { name: "Tractor", count: 67 },
];
const FAIR1M_MAX = Math.max(...FAIR1M_VEHICLES.map((v) => v.count));

export default function DatasetsPage() {
  return (
    <div style={{ padding: "60px 80px 100px" }}>
      <Reveal>
        <span className="section-badge">TRAINING DATA</span>
        <h1 className="gradient-text" style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
          Aerial Detection Datasets
        </h1>
        <p style={{ color: "var(--text-dim)", maxWidth: 700, marginBottom: 24, lineHeight: 1.7 }}>
          RAVEN is trained across three complementary aerial/satellite datasets, each contributing
          different object categories, scales, and orientations to the model.
        </p>
        <div style={{ display: "flex", gap: 12, marginBottom: 60, flexWrap: "wrap" }}>
          <MiniStat val="3" label="Datasets" />
          <MiniStat val="5,599" label="Total Images" />
          <MiniStat val="26" label="Object Classes" />
          <MiniStat val="OBB" label="Annotation Format" />
        </div>
      </Reveal>

      <Reveal>
        <div className="card" style={{ padding: 28, marginBottom: 60 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Why Oriented Bounding Boxes?</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
            Standard axis-aligned boxes (HBB) waste a large share of their area on background when
            an object is rotated — a ship at 45° packed into a horizontal box captures mostly water.
            Oriented boxes (OBB) hug the object&apos;s true footprint instead.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "rgba(255,80,80,0.1)", color: "#ff8080" }}>
              ❌ HBB wastes 60–70% area
            </span>
            <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "rgba(0,207,255,0.1)", color: "var(--cyan)" }}>
              ✔ OBB tight fit — 8x tighter localization
            </span>
          </div>
        </div>
      </Reveal>

      <DatasetBlock
        n="01"
        title="DOTA v1.0"
        downloadHref="https://captain-whu.github.io/DOTA/"
        paperHref="https://arxiv.org/abs/1711.10398"
        description="A large-scale dataset for object detection in aerial images, covering 15 object categories across a wide range of scales, orientations, and shapes."
        stats={[
          ["2,806", "Images"], ["188,282", "Instances"], ["15", "Classes"], ["0.657", "RAVEN mAP50"],
        ]}
        classes={DOTA_CLASSES}
        split="Train 1,411 / Val 458 / Test 937"
        format={`x1,y1,x2,y2,x3,y3,x4,y4\ncategory difficult`}
        image="/ui/DOTA.png"
      />

      <DatasetBlock
        n="02"
        title="HRSC2016"
        downloadHref="https://www.kaggle.com/datasets/guofeng/hrsc2016"
        paperHref="https://arxiv.org/abs/1610.00563"
        description="High-Resolution Ship Collection — fine-grained ship imagery from six major harbors, with a 26-class ship-type taxonomy."
        stats={[
          ["1,061", "Images"], ["2,976", "Instances"], ["26", "Sub-classes"], ["0.983", "RAVEN mAP50"],
        ]}
        classes={HRSC_CLASSES}
        split="Train 750 / Val 124 / Test 187"
        extraNote="Fine-tuning result: mAP50 went from 0.009 → 0.983 (+99.7% recovered)."
        image="/ui/HRSC.png"
      />

      <Reveal>
        <div style={{ marginTop: 60 }}>
          <p style={{ fontFamily: "var(--font-mono-brand)", color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>
            DATASET 03
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>FAIR1M</h2>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 13 }}>
            <a href="https://www.gaofen-challenge.com/benchmark" target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>Request Access ↗</a>
            <a href="https://arxiv.org/abs/2103.05569" target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>Read Paper ↗</a>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20, maxWidth: 700 }}>
            Fine-grained object recognition across 37 subcategories of vehicles and aircraft. RAVEN
            uses FAIR1M as a secondary classifier in DOTA Fine-grained mode — cropping each detected
            vehicle and re-classifying it into a precise subtype.
          </p>
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <MiniStat val="1,732" label="Available Images" />
            <MiniStat val="72,453" label="Vehicle Annotations" />
            <MiniStat val="10" label="Sub-classes used" />
            <MiniStat val="0.165" label="RAVEN mAP50" />
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Training progression</p>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 60 }}>
              {[0.022, 0.061, 0.098, 0.165].map((v, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: `${(v / 0.165) * 100}%`, background: "linear-gradient(180deg, var(--cyan), var(--purple))", borderRadius: 4 }} />
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>v{i + 1}: {v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Vehicle sub-classes by annotation count</p>
            {FAIR1M_VEHICLES.map((v) => (
              <div key={v.name} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span>{v.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{v.count.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-panel)", borderRadius: 3 }}>
                  <div style={{ width: `${(v.count / FAIR1M_MAX) * 100}%`, height: "100%", background: "var(--purple)", borderRadius: 3 }} />
                </div>
              </div>
            ))}
            <p style={{ marginTop: 16, fontSize: 12, color: "#ffb43c", background: "rgba(255,180,60,0.08)", padding: "8px 12px", borderRadius: 8 }}>
              Dataset limitation: class imbalance (Small Car dominates) limits accuracy on rarer subtypes like Tractor.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function MiniStat({ val, label }: { val: string; label: string }) {
  return (
    <div className="card" style={{ padding: "12px 20px", textAlign: "center" }}>
      <p style={{ fontWeight: 700, color: "var(--cyan)" }}>{val}</p>
      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

function DatasetBlock({
  n, title, downloadHref, paperHref, description, stats, classes, split, format, extraNote, image,
}: {
  n: string; title: string; downloadHref: string; paperHref: string; description: string;
  stats: [string, string][]; classes: string[]; split: string; format?: string; extraNote?: string; image?: string;
}) {
  return (
    <Reveal>
      <div style={{ marginBottom: 60 }}>
        <p style={{ fontFamily: "var(--font-mono-brand)", color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>
          DATASET {n}
        </p>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
        <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 13 }}>
          <a href={downloadHref} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>Download Dataset ↗</a>
          <a href={paperHref} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>Read Paper ↗</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{description}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {stats.map(([v, l]) => (
                <div key={l} className="card" style={{ padding: 14, textAlign: "center" }}>
                  <p style={{ fontWeight: 700, color: "var(--cyan)" }}>{v}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{l}</p>
                </div>
              ))}
            </div>
            {format && (
              <pre style={{ fontSize: 11, background: "var(--bg-panel)", padding: 12, borderRadius: 8, color: "var(--text-muted)", overflowX: "auto" }}>
                {format}
              </pre>
            )}
            {extraNote && (
              <p style={{ fontSize: 12, color: "#4ade80", marginTop: 10 }}>{extraNote}</p>
            )}
          </div>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {classes.map((c) => (
                <span key={c} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, background: "var(--bg-panel)", color: "var(--text-muted)" }}>
                  {c}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{split}</p>
          </div>
        </div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${title} sample`} style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 16, marginTop: 24 }} />
        )}
      </div>
    </Reveal>
  );
}
